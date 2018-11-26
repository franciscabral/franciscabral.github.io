var s;
var scl = 20;
var cols;
var rows;

var food;

function setup() {
    createCanvas(600, 600);
    cols = floor(width / scl);
    rows = floor(height / scl);

    s = new Snake();
    frameRate(10);
    pickLocation()
}


function pickLocation() {
    food = createVector(floor(random(cols)), floor(random(rows)))
    food.mult(scl);
}

function draw() {
    background(51);
    s.update();
    if (s.lose()) {
        s = new Snake();
    }
    s.show();
    if (s.eat(food)) {
        pickLocation();
    }

    fill(0, 255, 0);
    rect(food.x, food.y, scl, scl)
}

function keyPressed() {
    if (keyCode == UP_ARROW && (s.yspeed != 1 || s.tail.length == 0)) {
        s.dir(0, -1);
    } else if (keyCode == DOWN_ARROW && (s.yspeed != -1 || s.tail.length == 0)) {
        s.dir(0, 1);
    } else if (keyCode == RIGHT_ARROW && (s.xspeed != -1 || s.tail.length == 0)) {
        s.dir(1, 0);
    } else if (keyCode == LEFT_ARROW  && (s.xspeed != 1 || s.tail.length == 0)) {
        s.dir(-1, 0);
    }
}

function Snake() {
    this.x = 0;
    this.y = 0;

    this.xspeed = 1;
    this.yspeed = 0;

    this.total = 0;
    this.tail = [];

    this.eat = function (pos) {
        var d = dist(this.x, this.y, pos.x, pos.y)
        if (d < 1) {
            this.total++;
            return true;
        }

        return false;
    }

    this.dir = function (x, y) {
        this.xspeed = x;
        this.yspeed = y;
    }

    this.lose = function () {
        for (var i = 0; i < this.tail.length; i++) {
            var pos = this.tail[i];
            var d = dist(this.x, this.y, pos.x, pos.y);
            if (d < 1) {

                return true;
            }
        }
        return false;
    }

    this.update = function () {
        if (this.total === this.tail.length) {
            for (let i = 0; i < this.tail.length - 1; i++) {
                this.tail[i] = this.tail[i + 1];
            }
        }
        this.tail[this.total - 1] = createVector(this.x, this.y);

        this.x = this.x + this.xspeed * scl;
        this.y = this.y + this.yspeed * scl;

        if (this.x+scl > width) {
            this.x = 0;
        }

        if (this.x < 0) {
            this.x = width - scl
        }

        if (this.y+scl > height) {
            this.y = 0;
        }

        if (this.y < 0){
            this.y = width-scl;
        }

        //this.x = this.x.mod(rows)// constrain(this.x, 0, width - scl);
        //this.y = this.x.mod(cols)// constrain(this.y, 0, height - scl);
    }

    this.show = function () {
        fill(255)

        for (let i = 0; i < this.tail.length; i++) {
            rect(this.tail[i].x, this.tail[i].y, scl, scl)
        }

        rect(this.x, this.y, scl, scl)
    }

}


Number.prototype.mod = function (n) {
    return ((this % n) + n) % n;
};