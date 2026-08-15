var tileSize = 20;
var matrix = [];
var oldMatrix;
var generation = 0;
var imgs = [];

function preload() {
    imgs.push(loadImage("https://upload.wikimedia.org/wikipedia/commons/e/e0/Game_of_life_glider_gun.svg"))
    imgs.push(loadImage("https://upload.wikimedia.org/wikipedia/commons/7/72/Game_of_life_infinite1.svg"))
    imgs.push(loadImage("https://upload.wikimedia.org/wikipedia/commons/a/ae/Game_of_life_infinite2.svg"))
    imgs.push(loadImage("https://upload.wikimedia.org/wikipedia/commons/9/95/Game_of_life_infinite3.svg"))
    imgs.push(loadImage("https://upload.wikimedia.org/wikipedia/commons/9/99/Game_of_life_diehard.svg"))
    imgs.push(loadImage("https://upload.wikimedia.org/wikipedia/commons/b/b9/Game_of_life_acorn.svg"))
}


function setup() {
    var cnv = createCanvas(windowWidth, windowHeight);
    cnv.style('display', 'block');
    init();
    //frameRate(24)
}

function mousePressed() {
    init();
}

function keyPressed() {
    if (!isNaN(key)) {
        init(key - 1)
    }
}

function init(imgIndex) {
    var cols = floor(width / tileSize);
    var rows = floor(height / tileSize);
    //var imgIndex = window.location.href.split("?")[1];
    if (imgs)
        for (let x = 0; x < cols; x++) {
            matrix[x] = [];
            for (let y = 0; y < rows; y++) {
                matrix[x].push(isNaN(imgIndex) && random(1) > 0.50);
            }
        }
    if (!isNaN(imgIndex))
        drawOnMatrix(imageToMatrix(imgs[imgIndex]), floor(cols / 3), floor(rows / 3));
    generation = 1;
}

function draw() {
    background(0);

    fill(255);
    for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix[x].length; y++) {
            if (matrix[x][y]) {
                rect(x * tileSize, y * tileSize, tileSize, tileSize)
            }
        }
    }
    update();
}

function update() {
    saveMatrix = matrix.map(function (arr) {
        return arr.slice();
    });;
    for (let x = 0; x < matrix.length; x++) {
        for (let y = 0; y < matrix[x].length; y++) {
            matrix[x][y] = checkCell(x, y, saveMatrix);
        }
    }
    generation++;
}

function checkCell(x, y, m) {
    var n = 0;
    for (let i = x - 1; i <= x + 1; i++) {
        if (i >= 0 && i < m.length) {
            for (let j = y - 1; j <= y + 1; j++) {
                if (j >= 0 && j < m[x].length) {
                    //console.log(i,(i.mod(m.length)),j, j.mod(m[x].length))
                    if (i != x || j != y) {
                        //console.log(m[i][j])
                        m[i.mod(m.length)][j.mod(m[x].length)] && n++;
                    }
                }
            }

        }
    }

    //console.log(n)

    if (m[x][y]) {
        return n > 1 && n < 4;
    } else {
        return n === 3
    }
}

function drawOnMatrix(iMatrix, xOffSet, yOffSet) {
    for (let x = 0; x < iMatrix.length; x++) {
        for (let y = 0; y < iMatrix[x].length; y++) {
            matrix[x + xOffSet][y + yOffSet] = iMatrix[x][y]
        }
    }
}

function imageToMatrix(img) {

    var context = img.canvas.getContext("2d")
    var imgData = context.getImageData(0, 0, img.canvas.width, img.canvas.height)

    var offSetX = 8;
    var offSetY = 8;
    var tileSize = 16;

    var cols = floor(img.canvas.width / tileSize)
    var rows = floor(img.canvas.height / tileSize);
    var iMatrix = [];


    for (let x = 0; x < cols; x++) {
        iMatrix[x] = [];
        for (let y = 0; y < rows; y++) {
            var r, g, b
            [r, g, b] = getPixelXY(imgData, offSetX + x * tileSize, offSetY + y * tileSize)
            //console.log(r, g, b);
            iMatrix[x].push(r === 0)
        }
    }

    return iMatrix;


    function getPixel(imgData, index) {
        var i = index * 4, d = imgData.data;
        return [d[i], d[i + 1], d[i + 2], d[i + 3]]
    }


    function getPixelXY(imgData, x, y) {
        return getPixel(imgData, y * imgData.width + x);
    }
}

Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};