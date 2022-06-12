//   var playPromise = video.play();

// // In browsers that don’t yet support this functionality,
// // playPromise won’t be defined.
// if (playPromise !== undefined) {
//   playPromise.then(function() {
//       video.play();
//     // Automatic playback started!
//   }).catch(function(error) {
//       console.log(error + " " + video.src)
//     // Automatic playback failed.
//     // Show a UI element to let the user manually start playback.
//   });
// }

let useDatabase = false;
let canvasPosition = canvas.getBoundingClientRect();

const mouse = {
    click: false,
    x: null,
    y: null,
}

let newArea;

//Events for custom area Setting
canvas.addEventListener("mousedown", function (e) {

    mouse.click = true;
    mouse.x = e.x - canvasPosition.left;
    mouse.y = Math.round(e.y - canvasPosition.top) + window.pageYOffset;

    if (isCustomArea) {
        area.push(new CustomArea(mouse.x, mouse.y, 0, 0));
        newArea = area[area.length - 1];
        mouse.click = false;

        if (area.length < 1) {
            document.getElementById("custom_area_message").style.display = "block";
        }

    }
})

canvas.addEventListener("mouseup", function (e) {
    mouse.click = false;

    if (isCustomArea) {
        let mouseDownX = e.x - canvasPosition.left;
        let mouseDownY = e.y - canvasPosition.top + window.pageYOffset;

        if (mouseDownX >= newArea.x) newArea.width = (mouseDownX) - newArea.x;
        else {
            newArea.width = newArea.x - mouseDownX;
            newArea.x = mouseDownX;
        }

        if (mouseDownY >= newArea.y) newArea.height = mouseDownY - newArea.y;
        else {
            newArea.height = newArea.y - mouseDownY;
            newArea.y = mouseDownY;
        }

        if (newArea.width < 50 || newArea.height < 50) area.splice(-1, 1); //checks if new area is not a mistake/smaller then functional
        else addAreaSettings(area[area.length - 1].id);
        isDrawingNewArea = false;
        newArea = undefined;
        console.log(area);


        for (let i = 0; i < area.length; i++) {
            if (area[i].width * area[i].height < 50) { area.splice(i, 1); i-- }

        }
    }

});

let isDrawingNewArea = false; // draws new area while user is drawing;

canvas.addEventListener("mousemove", function (e) {
    mouse.x = e.x - canvasPosition.left;
    mouse.y = Math.round(e.y - canvasPosition.top) + window.pageYOffset;

    if (isCustomArea && newArea) isDrawingNewArea = true;

    // console.log(mouse.x + " " + mouse.y);
});

let triggerUI = document.getElementsByClassName("area_setting");

canvas.addEventListener("dblclick", function (e) {
    if (area.length > 0) {

        for (let i = 0; i < area.length; i++) {
            if (xYInRect(e.x - canvasPosition.left,
                Math.round(e.y - canvasPosition.top) + window.pageYOffset,
                area[i].x,
                area[i].y,
                area[i].width,
                area[i].height)) {

                let elem = triggerUI[i]
                elem.parentNode.removeChild(elem);
                area.splice(i, 1);
                i--;
                continue;
            }
        }
    }
});

let paused = false;

//HUD Buttons functions
function playVid() {
    video.play();
    paused = false;
}

function pauseVid() {
    video.pause();
    paused = true;
}

function resetVid() {
    video.pause();
    video.currentTime = 0;
    video.play();
    paused = false;
}

function printStats() {
    console.log("GS " + gridSize + "\n" +
        "Pix Ignore " + pixelIgnoreRange + "\n" +
        "Node Dis " + nodeDistance + "\n" +
        "Pix for obj " + pixelsRequiredForObject + "\n" +
        "MinMov " + minimumMovements + "\n");
}


//controls  // HUD
let controls = document.getElementsByClassName("slider");
let labels = document.getElementsByClassName("control_labels");

//Sliders
// let sensitivitySlider Defined in other file
let gridControl = controls[0];
let pixelControl = controls[1];
let nodeDisControl = controls[2];
let pixelForObjControl = controls[3];
let minMovementControl = controls[4];

//Sets new values on slider change
// grid.addEventListener("input", function () { newGridSize = grid.value; hasSettingsUpdated = true; labels[0].innerHTML = grid.value });
// pixelIgnore.addEventListener("input", function () { newPixelIgnoreRange = pixelIgnore.value; hasSettingsUpdated = true; labels[1].innerHTML = pixelIgnore.value });
// nodeDis.addEventListener("input", function () { newNodeDistance = nodeDis.value; hasSettingsUpdated = true; labels[2].innerHTML = nodeDis.value });
// pixelForObj.addEventListener("input", function () { newPixelsRequiredForObject = pixelForObj.value; hasSettingsUpdated = true; labels[3].innerHTML = pixelForObj.value });
// minMovement.addEventListener("input", function () { newMinimumMovements = minMovement.value; hasSettingsUpdated = true; labels[4].innerHTML = minMovement.value });

//new setting, used to overwrite mode settings.
// let newGridSize = gridSize;
// let newPixelIgnoreRange = pixelIgnoreRange;
// let newNodeDistance = nodeDistance;
// let newPixelsRequiredForObject = pixelsRequiredForObject;
// let newMinimumMovements = minimumMovements;

let personMode = {
    gridSize: 3,
    pixelIgnoreRange: 25,
    nodeDistance: 40,
    pixelsRequiredForObject: 30,
    minimumMovements: 5,
}


let carMode = {
    gridSize: 6,
    pixelIgnoreRange: 30,
    nodeDistance: 30,
    pixelsRequiredForObject: 10,
    minimumMovements: 5,
}


let detailMode = {
    gridSize: 4,
    pixelIgnoreRange: 35,
    nodeDistance: 40,
    pixelsRequiredForObject: 5,
    minimumMovements: 5,
}


let customMode = {
    gridSize: 4,
    pixelIgnoreRange: 35,
    nodeDistance: 40,
    pixelsRequiredForObject: 5,
    minimumMovements: 5,
}

function saveCustomMode() {
    let customMode = {
        "gridSize": gridSize,
        "pixelIgnoreRange": pixelIgnoreRange,
        "nodeDistance": nodeDistance,
        "pixelsRequiredForObject": pixelsRequiredForObject,
        "minimumMovements": minimumMovements,
    }

    localStorage.setItem("custom", JSON.stringify(customMode));
    var retrievedObject = JSON.parse(localStorage.getItem('custom'));
    console.log('retrievedObject: ', retrievedObject);
    return true;
}


let hasSettingsUpdated = false;
function updateSettings() {
    if (hasSettingsUpdated) {
        // customMode.gridSize = parseInt(newGridSize);
        // customMode.pixelIgnoreRange = parseInt(newPixelIgnoreRange);
        // customMode.nodeDistance = parseInt(newNodeDistance);
        // customMode.pixelsRequiredForObject = parseInt(newPixelsRequiredForObject);
        // customMode.minimumMovements = parseInt(newMinimumMovements);
        changeMode(3);
        hasSettingsUpdated = false;
    }
}

let modeCheckBoxes = document.getElementsByClassName("mode_check");
function changeMode(modeNo = 0) {
    for (let m = 0; m < modeCheckBoxes.length; m++) {
        if (m == modeNo) { modeCheckBoxes[modeNo].checked = true; continue };
        modeCheckBoxes[m].checked = false;
    }

    let mode;
    switch (modeNo) {
        case 0:
            mode = personMode;
            break;
        case 1:
            mode = carMode;
            break;
        case 2:
            mode = detailMode;
            break;
        case 3:
            mode = customMode;
            break;
        default:
            mode = personMode;
    }

    gridSize = mode.gridSize;
    pixelIgnoreRange = mode.pixelIgnoreRange;
    nodeDistance = mode.nodeDistance;
    pixelsRequiredForObject = mode.pixelsRequiredForObject;
    minimumMovements = mode.minimumMovements

    //setting sliders
    gridControl.value = gridSize;
    pixelControl.value = pixelIgnoreRange;
    nodeDisControl.value = nodeDistance;
    pixelForObjControl.value = pixelsRequiredForObject;
    minMovementControl.value = minimumMovements;

    //setting labels
    // labels[0].innerHTML = grid.value;
    // labels[1].innerHTML = pixelIgnore.value;
    // labels[2].innerHTML = nodeDis.value;
    // labels[3].innerHTML = pixelForObj.value;
    // labels[4].innerHTML = minMovement.value;

}

changeMode(0);
let area = [];

const alertSound = document.createElement("audio");
alertSound.src = "pop.mp3";
alertSound.volume = 0.1;

class CustomArea {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.isRemoved = false;

        this.id = Math.round(Math.random() * 1000);
        this.hasMovement = false; //Its references in javascript file (if there are moving pixels in the area)
        this.triggered = false; //if data should be send to database

        this.onDelay = false;
        this.cooldown = 20; //sec before data can be send to database (in case if there is too much noise in the area on canvas)

        this.delayTill;
        this.color = ""; //average color of the detected object

    }

    update() {

        if (this.hasMovement && this.triggered && !this.onDelay && !this.triggerLatency) {

            //Play sound
            alertSound.play();
            addTriggerLog(this.id);

            //Sets up form and sends data to database
            if (useDatabase) {
                let timeNow = new Date().toLocaleTimeString();

                let form = document.getElementById("canvas_form")
                let inputs = form.getElementsByTagName("input");

                inputs[0].value = dateToday(); //date
                inputs[1].value = timeNow; //time
                inputs[2].value = this.color; //car Color

                sendData();
                form.reset();
                this.color = "";

                // takePicture(); //function needs to be fixed
                // sendData({ date: dateToday(), time: timeNow, color: this.carColor })
            }
            console.log("Yay detected");
            //Set delay
            this.delayTill = frameCounter + 30 * this.cooldown; //30fps = 1s * 20 = 20sec delay
            this.onDelay = true;
        }

        //Resets trigger delay
        if (this.onDelay && frameCounter >= this.delayTill) {
            this.onDelay = false;
            this.hasMovement = false;
            // console.log("delay off");
        }

        this.draw();
    }

    draw() {
        ctx.beginPath();
        ctx.strokeStyle = "green"
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "orange";
        ctx.font = "18px Arial";
        ctx.fillText(this.id, this.x, this.y + 17);
        ctx.stroke();
    }
}


function addAreaSettings(index) {
    //Parents container
    var settingDiv = document.createElement("div");
    settingDiv.classList.add("area_setting");

    document.getElementById("triggers").appendChild(settingDiv);

    //id
    let idLabel = document.createElement("label");
    idLabel.innerHTML = "ID: " + index;
    idLabel.style.color = "blue";
    idLabel.style.fontWeight = "bold";

    //delay
    let delayLabel = document.createElement("label");
    delayLabel.innerHTML = "Trigg Delay: ";
    let delay = document.createElement("input");
    delay.setAttribute("type", "number");
    delay.style.width = "35px";
    delay.value = 20;
    delay.addEventListener("change", function () {

        let arrayIndex = findArrayIndex(area, index);
        area[arrayIndex].cooldown = delay.value;
    })


    //trigger
    let triggerLabel = document.createElement("label");
    triggerLabel.innerHTML = " Trigg Alarm: ";
    let trigger = document.createElement("input");
    trigger.setAttribute("type", "checkbox");
    trigger.setAttribute("data", index)
    trigger.addEventListener("click", function () {
        let arrayIndex = findArrayIndex(area, index);
        area[arrayIndex].triggered = !area[arrayIndex].triggered;
        console.log("trigger set");
    })

    //remove
    let removeButton = document.createElement("button");
    removeButton.innerHTML = "X";
    removeButton.addEventListener("click", function () {

        let arrayIndex = findArrayIndex(area, index);
        area.splice(arrayIndex, 1);

        let elem = triggerUI[arrayIndex];
        elem.parentNode.removeChild(elem);

    })


    let lineBreak = document.createElement("br");

    settingDiv.appendChild(idLabel);
    settingDiv.appendChild(lineBreak);
    settingDiv.appendChild(triggerLabel);
    settingDiv.appendChild(trigger);
    settingDiv.appendChild(delayLabel);
    settingDiv.appendChild(delay);
    settingDiv.appendChild(removeButton);

}

function findArrayIndex(array, id) {
    for (let i = 0; i < array.length; i++) {
        if (array[i].id == id) return i;
        else continue;
    }
}

function addTriggerLog(id) {

    let div = document.createElement("div");
    div.style.textAlign = "center";
    div.classList.add("message");

    let label = document.createElement("label");
    label.innerHTML = "ID: " + id;

    let label1 = document.createElement("label");
    let date = timeToday();
    label1.innerHTML = " " + date;

    div.appendChild(label);
    div.appendChild(label1);
    let log = document.getElementById("trigger_log");
    log.appendChild(div);
    if (log.childElementCount > 40) {
        let firstElement = log.getElementsByTagName("div")[0];
        log.removeChild(firstElement);

    }

}

function dateToday() {
    let today = new Date();
    let dd = String(today.getDate()).padStart(2, '0');
    let mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    let yyyy = today.getFullYear();

    today = yyyy + '-' + mm + '-' + dd;
    return today;
}

function timeToday() {
    let time = new Date()

    let year = time.getFullYear();
    let month = time.getMonth();
    let day = time.getDate();
    let hour = time.getHours();
    let minute = time.getMinutes();
    let second = time.getSeconds();

    let date =
        hour + ":" +
        minute + ":" +
        second + " " +
        day + "/" +
        month + "/" +
        year;

    return date;
}

function toggleAutoSensitivity() {
    autoSensitivity = !autoSensitivity;
    if (autoSensitivity) sensitivitySlider.setAttribute("disabled", true);
    else sensitivitySlider.removeAttribute("disabled");
}

window.addEventListener("resize", function () {
    canvasPosition = canvas.getBoundingClientRect();
});