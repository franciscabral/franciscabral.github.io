var stars = new Array(1000)

function setup() {
    createCanvas(800, 800);
    for (let i = 0; i < stars.length; i++) {
        stars[i] = new Star();
    }
}

function draw() {
    background(0,10);

    translate(width/2, height/2)
    for (let i = 0; i < stars.length; i++) {
        stars[i].update();
        stars[i].draw();
    }
}

function Star() {
    this.x = random(-width, width);
    this.y = random(-height, height);
    this.z = random(width);//random(0,width);

    this.update = function () {
        this.z = this.z - 5;
        if (this.z < 1){
            this.z = width;
            this.x = random(-width, width);
            this.y = random(-height, height);
        }
        
    }

    this.draw = function () {
        fill(255);

        var sx = map(this.x / this.z, 0, 1, 0, width);
        var sy = map(this.y / this.z, 0, 1, 0, height);

        var r = map(this.z, 0, width, 16, 0)
        ellipse(sx, sy, r, r);
    }
}