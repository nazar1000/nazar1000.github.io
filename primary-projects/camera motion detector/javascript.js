"use strict"
let sensitivitySlider = document.getElementById("sensitivity_slider");

let devWidth = 1920 / 3;
let devHeight = 1080 / 3;


var video = document.getElementsByTagName("video")[0];

var constraints = { audio: false, video: { width: devWidth, height: devHeight, frameRate: { max: 30 } } };
let stream = null;

const image = document.getElementsByTagName("img")[0];
const canvas = document.getElementsByTagName("canvas")[0];
// let canvasPosition = canvas.getBoundingClientRect();
canvas.width = devWidth;
canvas.height = devHeight;
const ctx = canvas.getContext("2d");

//pixels settings
let isCustomArea = false; //whether only specific portion of image should be processed

let gridSize = 30;
let showGrid = false; //Shows gridSize for pixel checking
let showActiveGrid = false; //Shows pixels that have changed.

let pixelIgnoreRange = 30; // it will ignore pixel change where the colors (e.g: range is 5, RGB are 20,20,20. Ignored range will be 15 - 25.
let averageNoise = 10; //To account for object movement (the is no active object noise subtraction from background noise)
let autoSensitivity = true;

let nodeDistance = 60; //How far the nodes have to be to be counted as the same object
let pixelsRequiredForObject = 20; //objects have to have this no of pixels to count as real object.
let minimumMovements = 2; //how many pixels have to change for the object to be moving.

var totalPixelNoise = 0;

let manualCalibration = false; //not working right now

let oldData; //stores pixel information for every frame
let frameCounter = 0; //for timings/objects
let nodes = []; //stores all nodes;
let objects = [];//stores all objects

// Gets media
async function getMedia(constraints) {
    try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.onloadedmetadata = function (e) {
            video.play();
        }
        // use stream
    } catch (err) {
        //if error
        console.log(err);
    }
}
getMedia(constraints);


//When it is ready to stream
let streaming = false;
video.addEventListener("canplay", function (ev) {
    if (!streaming) {
        this.height = devHeight;
        this.width = devWidth;
        // console.log("works");
        streaming = true;
    }
}, false)

//When it is streaming
video.addEventListener("play", function (ev) {
    startProcessing();
}, false)

// let pictureData;
let objToPic; //contains object (used to create a screenshot on its position)
function takePicture() {

    //this needs to be fixed, current variables does not take the right screen shot, it needs to be based on object cords instead of the trigger box....
    let customCanvas = document.createElement("canvas");
    let customCtx = customCanvas.getContext("2d");
    customCanvas.width = objToPic.spreadX * 1.6;
    customCanvas.height = objToPic.spreadY * 1.6;

    let pictureData = ctx.getImageData(objToPic.x - objToPic.spreadX * 0.3, objToPic.y - objToPic.spreadY * 0.3, customCanvas.width, customCanvas.height);
    customCtx.putImageData(pictureData, 0, 0);

    let minifiedPic = customCanvas.toDataURL("image.png") //changes into code
    image.setAttribute("src", minifiedPic);
    console.log(minifiedPic);

    // pictureData = canvas.toDataURL("image.png")
    // image.setAttribute("src", pictureData);
    // console.log(pictureData);
}

function clearPicture() {
    //save pictures code here........

    // ctx.fillStyle = "#AAA";
    // ctx.fillRect(0,0, canvas.width, canvas.height);

    // var data = canvas.toDataURL("image/png");
    // console.log(data)
    // image.setAttribute("src", data);
}

//for manual 

// let sampleList = [];
// let range = 10;
// function addSample(red,green,blue) {
//     let sample = {
//         r: red,
//         rMin: (red-range < 0) ? 0 : red - range,
//         rMax: (red+range > 255) ? 255 : red +range,
//         g: green,
//         gMin: (green-range < 0) ? 0 : green - range,
//         gMax: (green+range > 255) ? 255 : green +range,
//         b: blue,
//         bMin: (blue-range < 0) ? 0 : blue - range,
//         bMax: (blue+range > 255) ? 255 : blue +range,
//     }
//     sampleList.push(sample);
// }


//User stats

let fps = 0;
let timerStart;
let timerReset = false;
let statLabels = document.getElementsByClassName("stats");

let framesRefresher = 30;

// Main loop for processing the image/video/stream
function startProcessing() {
    setInterval(function () {

        //Performance/stats
        if (timerStart == undefined || timerReset) {
            timerStart = Date.now();
            timerReset = false;
        }

        if (paused == false) {

            ctx.drawImage(video, 0, 0, canvas.width, devHeight);

            checkPixels(); //Check whether pixels have changed

            //If there is overwhelming number of pixel nodes, reset
            //Useful whenever image loads for the first time and all the pixels are new or the camera shakes.
            if (nodes.length > 1000) nodes.splice(1);

            for (let i = 0; i < nodes.length; i++) {
                nodes[i].draw();
            }

            findCluster(); //Finds cluster of pixel nodes and groups them.
            createObjects(); //Creates objects using the clusters found

            // if (autoSensitivity && frameCounter % 10 == 0) fixBackgroundNoise();

            nodes.splice(0);


        } //if paused

        //if user is drawing
        if (isDrawingNewArea) {
            ctx.beginPath();
            ctx.strokeStyle = "red";
            ctx.rect(newArea.x, newArea.y, mouse.x - newArea.x, mouse.y - newArea.y);
            ctx.stroke();

        }

        //Displays active areas if custom area box is ticked
        if (isCustomArea) {
            for (let i = 0; i < area.length; i++) {
                area[i].update();
            }
        }




        frameCounter++;
        // updateSettings(); //If UI settings have been updated (UI.js) e.g, user changed mode.


        fps++; //counts each frame

        //Calculates and sets usage and fps for user stats.
        let time = Date.now();
        let timePassed = (time - timerStart) / 1000;
        if ((time - timerStart) / 1000 >= 1) {
            statLabels[0].innerHTML = fps + " "; //fps label
            statLabels[1].innerHTML = Math.round((1 / (1 / (timePassed / fps))) / (1 / 30) * 100) + "% ";
            timerReset = true;

            if (fps > framesRefresher) framesRefresher++;
            else if (fps < framesRefresher) framesRefresher--;


            fps = 0;
        }


    }, 1000 / framesRefresher); //30fps
    // requestAnimationFrame(startProcessing);
}

//Checks pixels and compares them to old pixels to detect which have changed.
let imageData;
function checkPixels() {
    imageData = ctx.getImageData(0, 0, devWidth, devHeight); //Saves canvas data
    // if (frameCounter % (150) == 0) checkAverageBrightness(); //Testing/Experimental
    totalPixelNoise = 0;

    /*//Creates color sample on click;
    if(mouse.click) {
        x = mouse.x;
        y = mouse.y;
        let position = (y* 4 * imageData.width) + (x * 4);

        addSample(imageData.data[position], imageData.data[position+1], imageData.data[position+2]);
        console.log(sampleList[sampleList.length-1]);
    } */

    // Checks for data in screenshot
    for (let y = 0; y < imageData.height; y += gridSize) {
        for (let x = 0; x < imageData.width; x += gridSize) {
            let breakPoint = true;

            if (isCustomArea) {
                // Checks if this pixel is within the monitored area
                if (area.length == 0) continue;

                for (let a = 0; a < area.length; a++) {
                    if (!xYInRect(x, y, area[a].x, area[a].y, area[a].width, area[a].height)) continue; //if its false
                    else breakPoint = false;
                }
                if (breakPoint) continue;
            }

            if (imageData.data[(y * 4 * imageData.width) + (x * 4) + 3] > 254) {
                let position1 = (y * 4 * imageData.width) + (x * 4);

                if (oldData) {
                    //compares current frame with the last* frame with specified range difference.

                    if (imageData.data[position1] >= getMinMax(oldData.data[position1]).min && imageData.data[position1] <= getMinMax(oldData.data[position1]).max &&
                        imageData.data[position1 + 1] >= getMinMax(oldData.data[position1 + 1]).min && imageData.data[position1 + 1] <= getMinMax(oldData.data[position1 + 1]).max &&
                        imageData.data[position1 + 2] >= getMinMax(oldData.data[position1 + 2]).min && imageData.data[position1 + 2] <= getMinMax(oldData.data[position1 + 2]).max) {

                        //marks non moving pixels
                        if (showGrid) {
                            imageData.data[position1] = 0;
                            imageData.data[position1 + 1] = 0;
                            imageData.data[position1 + 2] = 255;
                        }

                    } else {
                        //pixels that have changed

                        //creates nodes
                        let nodeX = (position1 - y * 4 * imageData.width) / 4;
                        let nodeY = ((position1 / 4) - nodeX) / devWidth;

                        nodes.push(new Node(nodeX, nodeY));

                        //Marks movement
                        if (showActiveGrid) {
                            imageData.data[position1] = 0;
                            imageData.data[position1 + 1] = 255;
                            imageData.data[position1 + 2] = 0;

                        }
                        totalPixelNoise++;
                        // if (frameCounter % 1 == 0) console.log(totalPixelNoise);
                    }
                }

                // //For manual color calibration only
                // let isSampled = false;
                // //Checks agains sample colors
                // if (manualCalibration) {

                //     for (let i = 0; i < sampleList.length; i++) {          
                //         let position = (y* 4 * imageData.width) + (x * 4);

                //         //Checks if color maches stored sample
                //         if (imageData.data[position] >= sampleList[i].rMin && imageData.data[position] <= sampleList[i].rMax  &&
                //             imageData.data[position+1] >= sampleList[i].gMin && imageData.data[position+1] <= sampleList[i].gMax &&
                //             imageData.data[position+2] >= sampleList[i].bMin && imageData.data[position+2] <= sampleList[i].bMax) {

                //             //set colors blue, visual only
                //             // imageData.data[position] = 0;
                //             // imageData.data[position + 1 ] = 0;
                //             // imageData.data[position + 2 ] = 255;

                //             isSampled = true;
                //         }
                //     }

                //     if (isSampled == false) {
                //         //set colors green, if not sampled
                //         imageData.data[(y* 4 * imageData.width) + (x * 4)] = 0;
                //         imageData.data[(y* 4 * imageData.width) + (x * 4) + 1 ] = 255;
                //         imageData.data[(y* 4 * imageData.width) + (x * 4) + 2 ] = 0;

                //     }

                // }
            }
        }
    }
    // if (frameCounter % 20 == 0) console.log(totalPixelNoise);
    if (autoSensitivity && frameCounter % 20 == 0) fixBackgroundNoise();


    //creates a copy of old frame
    oldData = ctx.getImageData(0, 0, devWidth, devHeight);
    ctx.putImageData(imageData, 0, 0);

    function getMinMax(number, radius = pixelIgnoreRange) {
        let minMax = {
            min: number - radius < 0 ? 0 : number - radius,
            max: number + radius > 255 ? 255 : number + radius,
        }
        return minMax;
    }
}

let groupUp = 1; //Group number
let isMergingSameSize = true; //Will merge groups that are the same size and next to eachother

//Finds clusters of pixel nodes that are next to each other and creates object, also checks object for movements
function findCluster() {

    //This could be better, current algorythm requires repeats to correctly mark clusters....
    // for (let i = 0; i < 10; i++) {
    for (let n = 0; n < nodes.length; n++) {
        for (let n1 = 0; n1 < nodes.length; n1++) {
            if (nodes[n].id == nodes[n1].id) continue; //if nodes are the same
            if (checkDistance(nodes[n].x, nodes[n].y, nodes[n1].x, nodes[n1].y) < nodeDistance) {

                //if nodes are within distance of each other, if group == 0, create new object...
                if (nodes[n].groupNo == 0) {
                    nodes[n].groupNo = groupUp++;
                    objects.push(new Object(1, nodes[n].groupNo));
                    // groups[nodes[n].groupNo] = (groups[nodes[n].groupNo])+1;
                }

                let node1 = findObject(nodes[n].groupNo);
                let node2;
                if (nodes[n1].groupNo != 0) {
                    node2 = findObject(nodes[n1].groupNo);
                }

                //nodes have order system, not userfull in current program,
                //Following code is, if node 2 is not part of a group, it becomes part of node1 group, else compare by size and make smaller node part of bigger node.
                if (nodes[n].orderNo == 0) {
                    nodes[n].orderNo = node1.nodesNo;
                }

                if (nodes[n1].groupNo == 0) {
                    nodes[n1].orderNo = node1.nodesNo + 1;

                    nodes[n1].groupNo = nodes[n].groupNo;
                    node1.nodesNo++;

                } else if (nodes[n1].groupNo != nodes[n].groupNo) {
                    if (node1.nodesNo > node2.nodesNo || (isMergingSameSize && node1.nodesNo == node2.nodesNo)) {
                        // if one group is bigger then other, or both are the same.
                        node1.nodesNo++;
                        node2.nodesNo--;

                        nodes[n1].groupNo = nodes[n].groupNo;
                        nodes[n1].orderNo = node1.nodesNo;
                    }
                }
            }
        }
    }
    // }
}

//Finds medians for diffrent node groups and updates objects based on them
function createObjects() {
    for (let obj = 0; obj < objects.length; obj++) {
        let movements = 0;
        let totalNodes = 0;
        let totalX = 0;
        let totalY = 0;
        let minX, minY, maxX, maxY;
        for (let n = 0; n < nodes.length; n++) {

            if (objects[obj].isMovingObject) {
                //Checks nodes if they are within object
                if (inRect(nodes[n].x, nodes[n].y, objects[obj].x, objects[obj].y, objects[obj].spreadX, objects[obj].spreadY)) {
                    movements++;
                }

                //Checks if object is moving based on the pixels detected.
                if (n == nodes.length - 1) {
                    if (movements > minimumMovements) {
                        //object is alive
                        objects[obj].isMovementsDetected = false; //false means true for the purpose of code in class Object.
                        // console.log("movement!!!");
                        //Used to detect movement in area
                        if (isCustomArea) {
                            for (let a = 0; a < area.length; a++) {
                                if (xYInRect(objects[obj].x, objects[obj].y, area[a].x, area[a].y, area[a].width, area[a].height)) {

                                    let objMidX = (objects[obj].x + objects[obj].spreadX / 2);
                                    let objMidY = (objects[obj].y + objects[obj].spreadY / 2);
                                    let middlePixel = (objMidY * 4 * imageData.width) + (objMidX * 4);

                                    let red = imageData.data[middlePixel];
                                    let green = imageData.data[middlePixel + 1];
                                    let blue = imageData.data[middlePixel + 2];

                                    let color = "RGB: " + red + "," + green + "," + blue;
                                    area[a].color = color;
                                    area[a].hasMovement = true;
                                    objToPic = objects[obj];
                                    break;
                                }
                            }
                        }

                    } else {
                        objects[obj].isMovementsDetected = true;
                    }

                    if (movements != 0) {
                        objects[obj].nodeAverage.push(movements);
                    }
                }
                continue;
            }


            //Sets average center of the object based on all the nodes
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
                    // compares borders with Object border/sides
                    if (nodes[n].x < minX) minX = nodes[n].x;
                    else if (nodes[n].x > maxX) maxX = nodes[n].x;
                    if (nodes[n].y < minY) minY = nodes[n].y;
                    else if (nodes[n].y > maxY) maxY = nodes[n].y;
                }
            }

            if (n == nodes.length - 1 && objects[obj].nodesNo > pixelsRequiredForObject) {

                //Calculates the center of object based on ratio of coridinates 
                //(e.g more nodes on left means center will be more biased towards left)

                // let objX = Math.round(totalX/totalNodes);
                // let objY = Math.round(totalY/totalNodes);
                // objects[obj].x = objX;
                // objects[obj].y = objY;

                //calcualtes center of object, x,y represent center of object
                objects[obj].x = minX + (maxX - minX) / 2;
                objects[obj].y = minY + (maxY - minY) / 2;

                objects[obj].spreadX = maxX - minX;
                objects[obj].spreadY = maxY - minY;

                objects[obj].isMovingObject = true;
            } else {
                // objects[obj].remove = true;

            }
        }
    }

    //Removes objects
    for (let obj = 0; obj < objects.length; obj++) {
        if (objects[obj].remove || objects[obj].nodesNo == 0) {
            objects.splice(obj, 1);
            obj--;

            continue;
        }

        //Compares objects based on size
        for (let obj1 = 0; obj1 < objects.length; obj1++) {
            if (objects[obj].id == objects[obj1].id) continue;
            // if (inRect(objects[obj1].x, objects[obj1].y, objects[obj].x, objects[obj].y, objects[obj].spreadX, objects[obj].spreadY)) {

            //rectInRect (x,y,w,h,x1,y1,w1,h1, proportions) 1 = actuall rect, 0.5 = 25% smaller sides, 50% smaller rect. 
            //Checks whether objects are within eachother,
            if (objects[obj].isMovingObject &&
                rectInRect(objects[obj].x - objects[obj].spreadX / 2,
                    objects[obj].y - objects[obj].spreadY / 2,
                    objects[obj].spreadX,
                    objects[obj].spreadY,
                    objects[obj1].x - objects[obj1].spreadX / 2,
                    objects[obj1].y - objects[obj1].spreadY / 2,
                    objects[obj1].spreadX,
                    objects[obj1].spreadY,
                    0.8)) {

                // obj > obj1 
                //if object is smaller, add it to the bigger object
                if (objects[obj1].nodesNo < objects[obj].nodesNo) {
                    objects[obj].nodesNo += objects[obj1].nodesNo;
                    findNewXYSpread(objects[obj], objects[obj1]); // Recalculate borders based on the objects
                }

                objects[obj1].remove = true;
                objects[obj].isExisting = true;
                // objects[obj].nodesNo += objects[obj1].nodesNo;
                objects[obj].x = objects[obj1].x;
                objects[obj].y = objects[obj1].y;
                // objects[obj].id = objects[obj1].id;

                objects[obj].spreadX = objects[obj1].spreadX;
                objects[obj].spreadY = objects[obj1].spreadY;

                // findNewXYSpread(objects[obj], objects[obj1]);
            } else {
                //     // objects[obj].remove = true;
            }
        }

        objects[obj].update();

    }
}

//Represents pixels that have changed color more then specified range (pixelIgnoreRange) suggesting a movement has occurred
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
        ctx.fillStyle = "orange";
        // ctx.rect(this.x-2, this.y-2, 4, 4);

        // if (this.orderNo != undefined) {
        //     ctx.font = "10px Arial"; 
        //     ctx.fillText("O "+ this.orderNo, this.x, this.y-5);
        //     ctx.fillText("G "+ this.groupNo, this.x, this.y+5);
        // }

        // ctx.stroke();
        // ctx.fill();


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
        this.timeCreated = Date.now();
        this.timeAlive = 0;

        this.nodeAverage = [];
        this.average = 0;


        this.isMovingObject = false; //if it meets requirements to be an object
        this.isExisting = false; //if it exists after comparing with other objects
        this.isMovementsDetected = true; //if pixels have been detected inside this object.
        this.remove = false;

        this.delayTimeStamp = frameCounter;
        this.delay = 20;

        this.isReady = false;
    }

    update() {
        if (!this.isReady) {
            if (this.isMovingObject) {
                this.delay = 90;
            } else if (this.isMovingObject == false) {
                this.delay = 20;
            }
            this.isReady = true;
        }

        if (this.isExisting) {
            //If it still exists after comparing with other objects
            this.delayTimeStamp = frameCounter; //resets timer for deletion
            this.isExisting = false; //resets check for another frame
        }

        //if this object became other object and has not moved for longer period of time
        if (!this.isExisting && frameCounter > this.delayTimeStamp + this.delay /*&& !this.isMovingObject*/) {
            this.remove = true;
        }

        //if movements has been detected, resets timer for deletion
        if (!this.isMovementsDetected) {
            this.delayTimeStamp = frameCounter;
            this.isMovementsDetected = true;
        }

        //Checks if center of this objects has reached borders of the map
        if (this.x != 0 && this.y != 0 && checkArea(this.x, this.y)) this.remove = true;

        // if (frameCounter % 50 == 0) {
        // console.log((this.delayTimeStamp+this.delay)-frameCounter)
        // }

        this.timeAlive = (Date.now() - this.timeCreated) / 1000;
        // if (this.totalLive == 3) takePicture();
        this.draw();
    }

    draw() {
        if (this.x != undefined && this.y != undefined && this.isMovingObject) {
            ctx.beginPath();
            ctx.fillStyle = "blue";
            if (this.isMovementsDetected) {
                ctx.strokeStyle = "blue";
            } else ctx.strokeStyle = "red";
            ctx.font = "12px Arial";

            // ctx.drawImage(image1, this.x-this.spreadX/2, this.y-this.spreadY/2, this.spreadX, this.spreadY); //image
            ctx.rect(this.x - this.spreadX / 2, this.y - this.spreadY / 2, this.spreadX, this.spreadY); // square around object
            // ctx.rect(this.x, this.y, 5, 5); //point at object
            // ctx.fill();
            ctx.stroke();

            if (frameCounter % 30 == 0) {
                let total = 0;
                for (let n = 0; n < this.nodeAverage.length; n++) {
                    total += this.nodeAverage[n];

                    if (n == this.nodeAverage.length - 1) {
                        this.average = total / this.nodeAverage.length
                        this.nodeAverage.splice(1, this.nodeAverage.length);

                    }
                }
            }

            ctx.beginPath();
            ctx.fillStyle = "yellow";
            // ctx.fillText("SUS DETECTED " /*+ this.id*/ +((this.delayTimeStamp+this.delay)-frameCounter)  , this.x-50, this.y)
            // ctx.fillText("SUS DETECTED " + this.timeAlive  , this.x-50, this.y)
            // ctx.fillText("O " + this.id + " N " + Math.round(this.average), this.x - 50, this.y)
            ctx.fillText("Object", this.x - this.spreadX / 2, this.y - this.spreadY / 2 + 15)

            ctx.stroke();
        }
    }
}

//Helper functions
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

function inRect(x, y, x1, y1, spreadX, spreadY) {
    if (x >= x1 - spreadX / 2 && x <= x1 + spreadX / 2 &&
        y >= y1 - spreadY / 2 && y <= y1 + spreadY / 2) return true;
    else return false;
}

function xYInRect(x, y, x1, y1, width, height) {
    if (x > x1 && x < x1 + width &&
        y > y1 && y < y1 + height) {
        return true;
    } else return false;
}

function checkArea(x, y) {
    if (area.length == 0) {
        if (x <= 0 + gridSize * 4 || x >= canvas.width - gridSize * 4 ||
            y <= 0 + gridSize * 4 || y >= canvas.height - gridSize * 4) return true;
        else return false;
    } else {
        for (let i = 0; i < area.length; i++) {
            if (x <= area[i].x + gridSize * 4 || x >= area[i].width - gridSize * 4 + area[i].x ||
                y <= area[i].y + gridSize * 4 || y >= area[i].height - gridSize * 4 + area[i].y) {
                return true;
            }
        } return false;
    }
}


function fixBackgroundNoise() {
    // if (autoSensitivity && frameCounter % 20 == 0) {
    // console.log("noise: " + totalPixelNoise + " Sensitivity " + pixelIgnoreRange);
    if (totalPixelNoise > averageNoise) pixelIgnoreRange++;
    else if (totalPixelNoise < 1) pixelIgnoreRange--;

    if (pixelIgnoreRange > 50) pixelIgnoreRange = 50;
    if (pixelIgnoreRange < 1) pixelIgnoreRange = 1;

    sensitivitySlider.value = pixelIgnoreRange;
    // }
}


//checks if rect overlaps another rect
function rectInRect(x, y, w, h, x1, y1, w1, h1, proportions = 1) {

    //propotions represent how close object 0 has to get to object 1, 
    //smaller then 1 will mean object 0 has to get closer to rect 1 inside its grids.
    //e.g. proportion 0.5, will mean that rect 1 w&h will be half smaller, relative to center of initial rect.
    if (proportions < 1) {
        x1 = x1 + (w1 * (1 - proportions)) / 2;
        w1 = w1 * proportions;

        y1 = y1 + (h1 * (1 - proportions)) / 2;
        h1 = h1 * proportions;
    }


    if (((x + w >= x1 && x + w <= x1 + w1) ||
        (x >= x1 && x <= x1 + w1)) &&

        ((y + h >= y1 && y + h <= y1 + h1) ||
            (y >= y1 && y <= y1 + h1)) ||

        //if center xy is within x1y1, in case x1y1 is wider or longer then xy.
        (x + w / 2 >= x1 && x + w / 2 <= x1 + w1 &&
            y + h / 2 >= y1 && y + h / 2 <= y1 + h1)) {

        return true;
    } else return false;
}


function findNewXYSpread(obj, obj1) {
    let newX;
    let newY;
    let newSpreadX;
    let newSpreadY;

    if (obj.x >= obj1.x) newX = obj1.x + (obj.x - obj1.x) / 2;
    else newX = obj.x + (obj1.x - obj.x) / 2;

    if (obj.y >= obj1.y) newY = obj1.y + (obj.y - obj1.y) / 2;
    else newY = obj.y + (obj1.y - obj.y) / 2;

    newSpreadX = (obj.spreadX + obj1.spreadX) / 2;
    newSpreadY = (obj.spreadY + obj1.spreadY) / 2;

    obj.x = newX;
    obj.y = newY;
    obj.spreadX = newSpreadX;
    obj.spreadY = newSpreadY;
}

// const imagel = new Image();
// imagel.src = "lol.jpg";


function checkAverageBrightness() {
    let total = 0;
    let aveRed = 0;
    let aveGreen = 0;
    let aveBlue = 0;
    for (let y = 0; y < imageData.height; y++) {
        for (let x = 0; x < imageData.width; x++) {

            let position1 = (y * 4 * imageData.width) + (x * 4);

            aveRed += imageData.data[position1];
            aveGreen += imageData.data[position1 + 1];
            aveBlue += imageData.data[position1 + 2];
            total++;
            // if (y == 349) {
            //     console.log("something");
            // }

            if (y == imageData.height - 1 && x == imageData.width - 1) {
                // console.log("Red: " + aveRed / total + " Green: " + aveGreen / total + " Blue: " + aveBlue / total);

                aveRed = aveRed / total;
                aveGreen = aveGreen / total;
                aveBlue = aveBlue / total;

                let averageBrightness = 0.2126 * aveRed + 0.7152 * aveGreen + 0.0722 * aveBlue;
                console.log(averageBrightness);

            }
            //marks non moving pixels
            // if (showGrid) {
            //     imageData.data[position1] = 0;
            //     imageData.data[position1 + 1] = 0;
            //     imageData.data[position1 + 2] = 255;
            // }
        }
    }
}


//Future plans

//Snapshop functionality, saving location
//timer delay/system for survilance camera (sound for extra points :P) I think done :P

//Extra
// Multiple cameara setup