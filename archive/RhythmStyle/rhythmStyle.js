let widthPanel = 800;
let heightPanel = 800;
let rectColor = 0;
let arrowsDirection;
let drawTriangleObj;
let sequence = [];
let feedBackFrames = 0;

function setup() {
    let cnv = createCanvas(widthPanel, heightPanel);
    arrowsDirection = ["LEFT_ARROW", "DOWN_ARROW", "UP_ARROW", "RIGHT_ARROW"];

    drawTriangleObj = {
        UP_ARROW: upTriangleAtPosition,
        DOWN_ARROW: downTriangleAtPosition,
        RIGHT_ARROW: rightTriangleAtPosition,
        LEFT_ARROW: leftTriangleAtPosition
    }
    sequence.push({
        arrow: random(arrowsDirection),
        xpos: random([100, 300, 500, 700]),
        ypos: 800
    });
    frameRate(600);
}

function keyPressed() {
    if (keyCode == UP_ARROW) {
        if (sequence[0].arrow == "UP_ARROW" && sequence[0].ypos < 200) {
            rectColor = 255;
            feedBackFrames = 3;
            sequence.shift();
        } else {
            rectColor = "red";
            feedBackFrames = 2;
        }
    } else if (keyCode == DOWN_ARROW) {
        if (sequence[0].arrow == "DOWN_ARROW" && sequence[0].ypos < 200) {
            rectColor = 255;
            feedBackFrames = 3;
            sequence.shift();
        } else {
            rectColor = "red";
            feedBackFrames = 2;
        }
    } else if (keyCode == RIGHT_ARROW) {
        if (sequence[0].arrow == "RIGHT_ARROW" && sequence[0].ypos < 200) {
            rectColor = 255;
            feedBackFrames = 3;
            sequence.shift();
        } else {
            rectColor = "red";
            feedBackFrames = 2;
        }
    } else if (keyCode == LEFT_ARROW) {
        if (sequence[0].arrow == "LEFT_ARROW" && sequence[0].ypos < 200) {
            rectColor = 255;
            feedBackFrames = 3;
            sequence.shift();
        } else {
            rectColor = "red";
            feedBackFrames = 2;
        }
    }
}

function draw() {
    background("#82117e");
    if (feedBackFrames > 0) {
        feedBackFrames--;
    }
    fill(rectColor);
    rect(0, 0, 800, 200);
    if (feedBackFrames == 0) {
        rectColor = 0;
    }
    let lowPosY = 0;
    let popLast = false;
    for (let i = 0; i < sequence.length; i++) {
        drawTriangleObj[sequence[i].arrow](sequence[i].xpos, sequence[i].ypos);
        if (sequence[i].ypos > lowPosY) {
            lowPosY = sequence[i].ypos;
        }
        sequence[i].ypos -= 5;
        if (sequence[i].ypos < 0) {
            popLast = true;
        }
    }
    popLast && sequence.shift();
    if (lowPosY < 600) {
        var randomArrow = Math.floor(random() * 4);
        sequence.push({
            arrow: arrowsDirection[randomArrow],
            xpos: randomArrow * 200 + 100,
            ypos: 800
        })
    }
}


function upTriangleAtPosition(x, y) {
    fill("green");
    triangle(
        x, y - 100,
        x + 100,
        y + 100,
        x - 100,
        y + 100);

}

function downTriangleAtPosition(x, y) {
    fill("blue");
    triangle(
        x, y + 100,
        x - 100,
        y - 100,
        x + 100,
        y - 100);
}

function leftTriangleAtPosition(x, y) {
    fill("pink");
    triangle(
        x - 100,
        y,
        x + 100,
        y - 100,
        x + 100,
        y + 100,
    )
}

function rightTriangleAtPosition(x, y) {
    fill("red");

    triangle(
        x + 100,
        y,
        x - 100,
        y + 100,
        x - 100,
        y - 100,
    )
}