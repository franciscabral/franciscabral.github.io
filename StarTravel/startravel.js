var stars;

function setup() {
    stars = new Array(1000);
    createCanvas(600, 600);
    for (var i = 0; i < stars.length; i++) {
        stars[i] = new Star();
    }
}

function draw() {
    background(0, 20);

    translate(width / 2, height / 2);
    for (var i = 0; i < stars.length; i++) {
        stars[i].update();
        stars[i].draw();
    }
}

function Star() {
    this.x = random(-width / 2, width / 2);
    this.y = random(-height / 2, height / 2);
    this.z = random(0, width);

    this.update = function () {
        this.z = this.z - 3;
        if (this.z < 1) {
            this.z = random(0, width); //random(width);
            this.x = random(-width / 2, width / 2);
            this.y = random(-height / 2, height / 2);
        }

    };

    this.draw = function () {
        fill(255);

        var sx = map(this.x / this.z, 0, 1, 0, width);
        var sy = map(this.y / this.z, 0, 1, 0, height);
        stroke(255);
        var r = map(this.z, 0, width, 4, 0);
        ellipse(sx, sy, r, r);
    };
}