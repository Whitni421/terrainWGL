import {crossProduct, storeQuad, drawColorNormalVertices} from './shapes2d.js';

class Terrain {
    constructor(WIDTH, HEIGHT) {
        this.WIDTH = WIDTH;
        this.HEIGHT = HEIGHT;
        this.baseWaterHeight = -1.5;
        this.waterHeight = this.baseWaterHeight;
    }

    F(x, y) {
        let z = 0;
        z = Math.sin(x / 10) * Math.cos(y / 10) * 10;
        return z;
    }

    draw(gl, shaderProgram) {
        let vertices = [];
        for (let i = 0; i < this.WIDTH; i++) {
            for (let j = 0; j < this.HEIGHT; j++) {

                const x1 = i;
                const y1 = j;
                const z1 = this.F(x1, y1);
                const x2 = i + 1;
                const y2 = j;
                const z2 = this.F(x2, y2);
                const x3 = i + 1;
                const y3 = j + 1;
                const z3 = this.F(x3, y3);
                const x4 = i;
                const y4 = j + 1;
                const z4 = this.F(x4, y4);

                let r = .1;
                let g = 1;
                let b = .5;
                let nx1 = x1;
                let ny1 = y1;
                let nz1 = z1;

                let nx2 = x2;
                let ny2 = y2;
                let nz2 = z2;
                let nx3 = x3;
                let ny3 = y3;
                let nz3 = z3;
                let nx4 = x4;
                let ny4 = y4;
                let nz4 = z4;
                let [nx,ny,nz] = crossProduct(x1,y1,z1,x2,y2,z2,x3,y3,z3);

                storeQuad(vertices, x1, y1, z1, nx, ny, nz,
                    x2, y2, z2, nx, ny, nz,
                    x3, y3, z3, nx, ny, nz,
                    x4, y4, z4, nx, ny, nz,
                    r, g, b, 1);

            }
        }
        drawColorNormalVertices(gl, shaderProgram, vertices, gl.TRIANGLES);
        vertices = [];
        this.waterHeight = this.baseWaterHeight + Math.sin(Date.now() / 1000) * .3;
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        const alpha = .9;
        storeQuad(vertices,
            0, 0, this.waterHeight, 0, 0, 1,
            this.WIDTH, 0, this.waterHeight, 0, 0, 1,
            this.WIDTH, this.HEIGHT, this.waterHeight, 0, 0, 1,
            0, this.HEIGHT, this.waterHeight, 0, 0, 1,
            .1, .3, .9, alpha);

        drawColorNormalVertices(gl, shaderProgram, vertices, gl.TRIANGLES);
        gl.disable(gl.BLEND);
    }
}

class Rat {
    constructor(x, y, WIDTH, HEIGHT) {
        this.WIDTH = WIDTH;
        this.HEIGHT = HEIGHT;
        this.x = x;
        this.y = y;
        this.z = 5;
        this.degrees = 0;
        this.SPIN_SPEED = 60; // Degrees per second, example value
        this.MOVE_SPEED = 2;
        this.angle = 0;
        this.baseWaterHeight = -1.5;
    }

    F(x, y) {
        let z = 0;
        z = Math.sin(x / 10) * Math.cos(y / 10) * 10;
        
        if (z < this.baseWaterHeight) {
            z = this.baseWaterHeight;
        } 
        z+=2;
        return z;
    }

    drawRat(gl, shaderProgram) {

        const radians = this.degrees * Math.PI / 180;

        let cx = this.x + 0.5;
        let cy = this.y + 0.5;

        let vertices = [];

        const points = [
            { x: this.x, y: this.y, z: 0 },
            { x: this.x + 1, y: this.y, z: 0 },
            { x: this.x + 1, y: this.y + 1, z: 0 },
            { x: this.x, y: this.y + 1, z: 0 },
            { x: this.x, y: this.y, z: 1 },
            { x: this.x + 1, y: this.y, z: 1 },
            { x: this.x + 1, y: this.y + 1, z: 1 },
            { x: this.x, y: this.y + 1, z: 1 }
        ];

        const rotatedPoints = points.map(p => {
            return {
                x: Math.cos(radians) * (p.x - cx) - Math.sin(radians) * (p.y - cy) + cx,
                y: Math.sin(radians) * (p.x - cx) + Math.cos(radians) * (p.y - cy) + cy,
                z: this.z
            };
        });
    
        // Assume crossProduct and color are correctly calculated for rotated points
        let [nx, ny, nz] = crossProduct(rotatedPoints[0].x, rotatedPoints[0].y, this.z, rotatedPoints[1].x, rotatedPoints[1].y, this.z, rotatedPoints[2].x, rotatedPoints[2].y, this.z);
        let r = 1, g = 0, b = 0;
    
        // Store rotated quad
        storeQuad(vertices,
            rotatedPoints[0].x, rotatedPoints[0].y, this.z, nx, ny, nz,
            rotatedPoints[1].x, rotatedPoints[1].y, this.z, nx, ny, nz,
            rotatedPoints[2].x, rotatedPoints[2].y, this.z, nx, ny, nz,
            rotatedPoints[3].x, rotatedPoints[3].y, this.z, nx, ny, nz,
            r, g, b, 1
        );
    
        // Draw the quad
        drawColorNormalVertices(gl, shaderProgram, vertices, gl.TRIANGLES);
    }
    
    spinLeft(DT){
        this.degrees += this.SPIN_SPEED * DT;
    }
    spinRight(DT){
        this.degrees -= this.SPIN_SPEED * DT;
        
    }
    scurryForward(DT){
        console.log(this.x,this.y);

        const dx = Math.cos(this.degrees*Math.PI/180) * this.MOVE_SPEED * DT;
        const dy = Math.sin(this.degrees*Math.PI/180) * this.MOVE_SPEED * DT;
        const newx= this.x + dx;
        const newy= this.y + dy;
        const newZ = this.F(newx,newy);
        let heightDifference = newZ - this.z;// For forward/backward and strafe movements
        let horizontalDistance = Math.sqrt(dx * dx + dy * dy); // Difference in terrain height
        this.angle = Math.atan2(heightDifference, horizontalDistance);
        this.x = newx;
        this.y= newy;
        this.z = newZ;

        
    }
    scurryBackward(DT){
        this.scurryForward(-DT);
    }
    strafeRight(DT){
        const dx = Math.cos((this.degrees-90)*Math.PI/180) * this.MOVE_SPEED * DT;
        const dy = Math.sin((this.degrees-90)*Math.PI/180) * this.MOVE_SPEED * DT;
        const newx= this.x + dx;
        const newy= this.y + dy;
        const newZ = this.F(newx,newy);
        let heightDifference = newZ - this.z;// For forward/backward and strafe movements
        let horizontalDistance = Math.sqrt(dx * dx + dy * dy);  // Difference in terrain height
        this.angle = Math.atan2(heightDifference, horizontalDistance);
        this.x = newx;
        this.y= newy;
        this.z = newZ;


        
    }
    strafeLeft(DT){
        const dx = Math.cos((this.degrees+90)*Math.PI/180) * this.MOVE_SPEED * DT;
        const dy = Math.sin((this.degrees+90)*Math.PI/180) * this.MOVE_SPEED * DT;
        const newx= this.x + dx;
        const newy= this.y + dy;
        const newZ = this.F(newx,newy);
        let heightDifference = newZ - this.z;// For forward/backward and strafe movements
        let horizontalDistance = Math.sqrt(dx * dx + dy * dy);  // Difference in terrain height
        this.angle = Math.atan2(heightDifference, horizontalDistance);
        this.x = newx;
        this.y= newy;
        this.z = newZ;

        
        
    }
}
function polarToCartesian(polar, alpha, zOffset, radius, xOffset, yOffset) {
    const x = xOffset + radius * Math.sin(polar) * Math.cos(alpha);
    const y = yOffset + radius * Math.sin(polar) * Math.sin(alpha);
    const z = zOffset + radius * Math.cos(polar);
    return [x, y, z];
}
export {Terrain,Rat};