"use strict"

const canvas = document.getElementsByTagName("canvas")[0];

canvas.width = 800;
canvas.height = 400;

const ctx = canvas.getContext("2d");
let nodes = []; //stores all nodes;
let objects = [];

let mouse = {
    x: 0,
    y: 0,
    click: false
}

let click = false

canvas.addEventListener("mousemove", function (e) {
    mouse.x = e.x;
    mouse.y = e.y;
})

canvas.addEventListener("mousedown", function () {
    mouse.click = true;
})

//UI settings
let noOfPoints = 100;
let nodeDistance = 50;
let isClustersToggle = true;
let isHeatmapToggle = true;
let isRelativeCentering = false;

let isReset = false;
function reset() {
    nodes.splice(0);
    objects.splice(0);
    groups.splice(0);
    init();
}


let link = 0;
let order = 0;


let groupUp = 1;
let groups = new Array(50);
for (let i = 0; i < groups.length; i++) {
    groups[i] = 0;

}

class Node {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.id = Math.random() * 5000;
        this.orderNo = 0;
        this.groupNo = 0;
    }

    draw() {
        ctx.beginPath();
        ctx.fillStyle = "red";
        ctx.rect(this.x - 2, this.y - 2, 4, 4);

        if (this.orderNo != undefined) {
            ctx.font = "10px Arial";
            // ctx.fillText("O " + this.orderNo, this.x, this.y - 5);
            // ctx.fillText("G " + this.groupNo, this.x, this.y + 5);
        }

        ctx.fill();
    }
}

class Object {
    constructor(nodesNo, groupNo) {
        this.x = 0;
        this.y = 0;
        this.nodesNo = nodesNo;
        this.groupNo = groupNo;
        this.id = Math.round(Math.random() * 5000);
        this.spreadX;
        this.spreadY;
    }

    update() {
        this.draw();
    }

    draw() {
        if (this.x != undefined && this.y != undefined && this.nodesNo > 2) {
            ctx.beginPath();
            ctx.strokeStyle = "blue";
            ctx.fillStyle = "blue";
            ctx.rect(this.x - this.spreadX / 2, this.y - this.spreadY / 2, this.spreadX, this.spreadY);
            ctx.fillText("G:" + this.groupNo, this.x - this.spreadX / 2, this.y - this.spreadY / 2 + 10);
            ctx.stroke();
        }
    }
}

function init() {
    //Spawns random possition nodes
    for (let i = 0; i < noOfPoints; i++) {
        let randomX = Math.random() * canvas.width;
        let randomY = Math.random() * canvas.height;
        nodes.push(new Node(randomX, randomY));
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isReset) {
        isReset = false;
        reset();
    }

    //Manually creates nodes
    if (mouse.click) {
        nodes.push(new Node(mouse.x, mouse.y));
        mouse.click = false;
    }

    //updates nodes
    for (let i = 0; i < nodes.length; i++) {
        nodes[i].draw();
    }

    // drawLine(); //connects dots ... used somewhere else...
    if (isHeatmapToggle) drawHeatMap();
    if (isClustersToggle) findCluster();

    //displays arrays for groups (to be replaced with object class)  //remove
    for (let i = 0; i < objects.length; i++) {
        if (objects[i] == undefined) continue;

        ctx.beginPath();
        ctx.fillStyle = "green";
        ctx.font = "10px Arial";
        ctx.fillText("G " + objects[i].groupNo + ": " + objects[i].nodesNo, 0, 10 * i + 10)
        ctx.fill();

    }

    //Finds medians for diffrent node groups.
    for (let obj = 0; obj < objects.length; obj++) {
        let totalNodes = 0;
        let totalX = 0;
        let totalY = 0;
        let minX, minY, maxX, maxY;

        for (let n = 0; n < nodes.length; n++) {
            if (nodes[n].groupNo == objects[obj].groupNo) {
                totalX += nodes[n].x;
                totalY += nodes[n].y;
                totalNodes++;

                if (minX == undefined || maxX == undefined || minY == undefined || minY == undefined) {
                    minX = nodes[n].x;
                    maxX = nodes[n].x;
                    minY = nodes[n].y;
                    maxY = nodes[n].y;
                } else {
                    if (nodes[n].x < minX) minX = nodes[n].x;
                    else if (nodes[n].x > maxX) maxX = nodes[n].x;
                    if (nodes[n].y < minY) minY = nodes[n].y;
                    else if (nodes[n].y > maxY) maxY = nodes[n].y;
                }
            }

            if (n == nodes.length - 1 && objects[obj].nodesNo > 0) {

                //Calculates the center of object based on ratio of coridinates 
                //(e.g more nodes on left means center will be more biased towards left)

                if (isRelativeCentering) {
                    let objX = Math.round(totalX / totalNodes);
                    let objY = Math.round(totalY / totalNodes);
                    objects[obj].x = objX;
                    objects[obj].y = objY;

                } else {
                    //calcualtes center of object
                    objects[obj].x = minX + (maxX - minX) / 2;
                    objects[obj].y = minY + (maxY - minY) / 2;

                    objects[obj].spreadX = maxX - minX;
                    objects[obj].spreadY = maxY - minY;
                }
            }
        }
    }

    //Removes empty objects
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].nodesNo == 0) {
            objects.splice(i, 1);
            continue;
        }
        objects[i].update();

    }
    requestAnimationFrame(animate);
}

// Draws lines between nodes based on distance
function drawLine() {
    for (let n = 0; n < nodes.length; n++) {
        for (let n2 = 0; n2 < nodes.length; n2++) {
            if (checkDistance(nodes[n].x, nodes[n].y, nodes[n2].x, nodes[n2].y) <= 200) {
                if (n == n2) continue;

                ctx.beginPath();
                ctx.strokeStyle = "red";
                ctx.lineWidth = 1;
                ctx.moveTo(nodes[n].x, nodes[n].y);
                ctx.lineTo(nodes[n2].x, nodes[n2].y);

                ctx.stroke();
            }

        }
    }
}

let areaSize = 4; //eg 5 = 5*5, 25zones
let heatAreas = new Array(areaSize);
let isHeatAreasReady = false;
let min = 0;
let max = 0;

function drawHeatMap() {
    let areaWidth = canvas.width / areaSize;
    let areaHeight = canvas.height / areaSize;

    if (!isHeatAreasReady) {
        for (let i = 0; i < heatAreas.length; i++) {
            heatAreas[i] = new Array(areaSize);
        }

        for (let y = 0; y < areaSize; y++) {
            for (let x = 0; x < areaSize; x++) {
                heatAreas[x][y] = 0;
            }
        }

        for (let n = 0; n < nodes.length; n++) {
            let areaX = nodes[n].x / areaWidth >= 1 ? Math.floor(nodes[n].x / areaWidth) : 0;
            let areaY = nodes[n].y / areaHeight >= 1 ? Math.floor(nodes[n].y / areaHeight) : 0;


            heatAreas[areaY][areaX] += 1;

            if (heatAreas[areaY][areaX] > max) max = heatAreas[areaY][areaX];
            else if (heatAreas[areaY][areaX] < min || min == 0) min = heatAreas[areaY][areaX];
        }

        isHeatAreasReady = false;
    }

    for (let x = 0; x < areaSize; x++) {
        for (let y = 0; y < areaSize; y++) {
            ctx.beginPath();
            ctx.rect(x * areaWidth, y * areaHeight, areaWidth, areaHeight);

            let color = (510 / max) * heatAreas[y][x];
            let red;
            let green;
            let blue = 0;

            if (color <= 255) {
                red = color;
                green = 255;

            } else {
                red = 255;
                green = 255 - (color - 255);
            }

            ctx.fillStyle = "rgba(" + red + "," + green + "," + 0 + ",0.1)";

            ctx.fill();
            ctx.lineWidth = 1;
            ctx.strokeStyle = "grey";
            ctx.stroke();
        }
    }


}

let isMergingSameSize = true;
// nodeDistance
function findCluster() {
    //debug 
    if (nodes.length == 5) {
        // console.log("test");
    }

    for (let index = 0; index < 1; index++) { //testing difference Not important
        for (let n = 0; n < nodes.length; n++) {
            for (let n1 = 0; n1 < nodes.length; n1++) {
                if (nodes[n].id == nodes[n1].id) continue;
                if (checkDistance(nodes[n].x, nodes[n].y, nodes[n1].x, nodes[n1].y) < nodeDistance) {

                    if (nodes[n].groupNo == 0) {
                        nodes[n].groupNo = groupUp++;
                        objects.push(new Object(1, nodes[n].groupNo));
                        // groups[nodes[n].groupNo] = (groups[nodes[n].groupNo])+1;
                    }

                    let nn = findObject(nodes[n].groupNo);
                    let nn1;
                    if (nodes[n1].groupNo != 0) {
                        nn1 = findObject(nodes[n1].groupNo);
                    }

                    if (nodes[n].orderNo == 0) {
                        nodes[n].orderNo = nn.nodesNo;
                    }

                    if (nodes[n1].groupNo == 0) {
                        nodes[n1].orderNo = nn.nodesNo + 1;

                        nodes[n1].groupNo = nodes[n].groupNo;
                        nn.nodesNo++;

                    } else if (nodes[n1].groupNo != nodes[n].groupNo) {
                        if (nn.nodesNo > nn1.nodesNo || (isMergingSameSize && nn.nodesNo == nn1.nodesNo)) {
                            // if one group is bigger then other, or both are the same.
                            nn.nodesNo++;
                            nn1.nodesNo--;

                            nodes[n1].groupNo = nodes[n].groupNo;
                            nodes[n1].orderNo = nn.nodesNo;
                        }
                    }

                    ctx.beginPath();

                    ctx.strokeStyle = "black";
                    // if (nodes[n].groupNo == 1) ctx.strokeStyle = "black";
                    // if (nodes[n].groupNo == 2) ctx.strokeStyle = "red";
                    // if (nodes[n].groupNo == 3) ctx.strokeStyle = "green";
                    // if (nodes[n].groupNo == 4) ctx.strokeStyle = "blue";
                    // if (nodes[n].groupNo == 5) ctx.strokeStyle = "violet";
                    // if (nodes[n].groupNo == 6) ctx.strokeStyle = "orange";
                    // if (nodes[n].groupNo == 7) ctx.strokeStyle = "brown";
                    // if (nodes[n].groupNo == 8) ctx.strokeStyle = "grey";
                    ctx.lineWidth = 1;



                    if (nn1 != undefined) {
                        if (nn.groupNo == nn1.groupNo || (isMergingSameSize && nn.nodesNo == nn1.nodesNo && nodes[n].groupNo != nodes[n1].groupNo)) {

                        }
                        ctx.moveTo(nodes[n].x, nodes[n].y);
                        ctx.lineTo(nodes[n1].x, nodes[n1].y);
                    }


                    ctx.stroke();

                }
            }
        }
    }
}

init();
animate();

function checkDistance(x, y, tx, ty) {
    let dx = x - tx;
    let dy = y - ty;
    return Math.sqrt(dx * dx + dy * dy);
}

function findObject(number) {
    for (let i = 0; i < objects.length; i++) {
        if (objects[i].groupNo == number) return objects[i];
        else continue;

    }
}