import { initShaderProgram } from "./shader.js";
import { storeQuad, drawColorNormalVertices } from "./shapes2d.js";
import {Terrain,Rat} from './terrain.js';

const TOP_VIEW = 1;
const OBSERVATION_VIEW = 2;
const RATS_VIEW = 3;
main();
async function main() {
	console.log('This is working');
	let currentTime= 0;

	//
	// start gl
	// 
	const canvas = document.getElementById('glcanvas');
	const gl = canvas.getContext('webgl');
	if (!gl) {
		alert('Your browser does not support WebGL');
	}
	gl.clearColor(0.53, 0.81, 0.92, 1.0);
	gl.enable(gl.DEPTH_TEST); // Enable depth testing
	gl.depthFunc(gl.LEQUAL); // Near things obscure far things
	gl.enable(gl.CULL_FACE);

	//
	// Create shaders
	// 

	const shaderProgram = initShaderProgram(gl, await (await fetch("colorNormalTriangles.vs")).text(), await (await fetch("colorNormalTriangles.fs")).text());

	//
	// Create content to display
	//
	const WIDTH = 100;
	const HEIGHT = 100;
	const terrain = new Terrain(WIDTH, HEIGHT);
	const r = new Rat(50,50,WIDTH,HEIGHT,terrain);
	let currentView = OBSERVATION_VIEW;


	
	//
	// load a modelview matrix onto the shader
	// 
	const modelViewMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uModelViewMatrix");
	const identityMatrix = mat4.create();
	gl.uniformMatrix4fv(modelViewMatrixUniformLocation, false, identityMatrix);


	//
	// Other shader variables:
	// 
	function setLightDirection(x, y, z) {
		gl.uniform3fv(
			gl.getUniformLocation(shaderProgram, "uLightDirection"),
		  [x, y, z]
		);
	  }
	  setLightDirection(0, 0, -1);

	  function setEye(x, y, z) {
		gl.uniform3fv(
			gl.getUniformLocation(shaderProgram, "uEyePosition"),
		  [x, y, z]
		);
	  }
	  let eye = [0, WIDTH/2, 30];
	  setEye(eye[0], eye[1], eye[2]);


	  const normalMatrix = mat3.create();
	  mat3.normalFromMat4(normalMatrix, identityMatrix);
	  gl.uniformMatrix3fv(
		gl.getUniformLocation(shaderProgram, "uNormalMatrix"),
		false,
		normalMatrix
	  );
	  let spinLeft = false;
	  let spinRight = false;
	  let scurryForward = false;
	  let scurryBackward = false;
	  let strafeLeft = false;
	  let strafeRight = false;
	  let goFast = false;
	  let terrainType = "Mountains"
  
	  window.addEventListener("keydown", keyDown);
	  function keyDown(event){
		if (event.code == 'KeyQ'){
			spinLeft = true;
		}		
		if (event.code == 'KeyW'){
			scurryForward = true;
		}
		if (event.code == 'KeyA'){
			strafeLeft = true;
		}
		if (event.code == 'KeyE'){
			spinRight = true;
		}
		if (event.code == 'KeyS'){
			scurryBackward = true;
		}
		if (event.code == 'KeyD'){
			strafeRight = true;
		}
		if (event.code == 'KeyO'){
			currentView = OBSERVATION_VIEW;
		}
		if (event.code == 'KeyT'){
			currentView = TOP_VIEW;
		}
		if (event.code == 'KeyR'){
			currentView = RATS_VIEW;
		}
		if(event.code == 'KeyF'){
			goFast=true;
		}
		 
	  }
	  window.addEventListener("keyup", keyUp);
	  function keyUp(event){
			if (event.code == 'KeyQ'){
				spinLeft = false;
			}
			if (event.code == 'KeyW'){
				scurryForward = false;
			}
			if (event.code == 'KeyA'){
				strafeLeft = false;
			}
			if (event.code == 'KeyE'){
				spinRight = false;
			}
			if (event.code == 'KeyS'){
				scurryBackward = false;
			}
			if (event.code == 'KeyD'){
				strafeRight = false;
			}
			if(event.code == 'KeyF'){
				goFast=false;
			}
			
		}

	//
	// Main render loop
	//
	let previousTime = 0;
	let frameCounter = 0;
	function redraw(currentTime) {
		currentTime *= .001; // milliseconds to seconds
		let DT = currentTime - previousTime;
		if (DT > .5)
			DT = .5;
		frameCounter += 1;
		if (Math.floor(currentTime) != Math.floor(previousTime)) {
			console.log(frameCounter);
			frameCounter = 0;
		}
		previousTime = currentTime;
		let speed = .1;
		if(spinLeft){
			r.spinLeft(speed);
		}
		if(scurryForward){
			r.scurryForward(speed);
		}
		if(strafeLeft){
			r.strafeLeft(speed);
		}
		if(spinRight){
			r.spinRight(speed);
		}
		if(scurryBackward){
			r.scurryBackward(speed);
		}
		if(strafeRight){
			r.strafeRight(speed);
		}
		if(goFast){
			r.scurryForward(speed*2);
		}
		if(currentView == OBSERVATION_VIEW){
			setObservationView(gl, shaderProgram, canvas.clientWidth / canvas.clientHeight, eye,WIDTH,HEIGHT)

		}
		// else if(currentView == TOP_VIEW){
		// 	setTopView(gl, shaderProgram,WIDTH,HEIGHT,canvas);
		// }
		else if(currentView == RATS_VIEW){
			setRatsView(gl, shaderProgram,WIDTH,HEIGHT,canvas,r);
		}

		//
		// Setup projection matrix
		//



		//
		// Draw
		//
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		terrain.draw(gl, shaderProgram,terrainType);
		r.drawRat(gl, shaderProgram,terrainType);
		drawSphere(gl, shaderProgram);

		requestAnimationFrame(redraw);
	}
	requestAnimationFrame(redraw);
};

// polar goes from 0 to PI (North pole to south pole)
// alpha goes from 0 to 2PI (such as around the equator)
function polarToCartesian(polar, alpha){
	// alpha is the horizontal angle from the positive X axis
	// polar is the vertical angle from the positive Z axis
	const x = Math.sin(polar) * Math.cos(alpha);
	const y = Math.sin(polar) * Math.sin(alpha);
	const z = Math.cos(polar);
	return [x,y,z];
}

function drawSphere(gl, shaderProgram) {
	const vertices = [];
	const strips = 50;
	for (let i = 0; i < strips; i++) {
		const polar1 = (i / strips ) * Math.PI; // 0 to PI (as z goes +1 to -1)
		const polar2 = ((i + 1) / strips) * Math.PI;
		for (let j = 0; j < strips; j++) {
			const alpha1 = j / strips * Math.PI * 2;
			const alpha2 = (j + 1) / strips * Math.PI * 2;
			const [x1,y1,z1] = polarToCartesian(polar1, alpha1);
			const [x2,y2,z2] = polarToCartesian(polar2, alpha1);
			const [x3,y3,z3] = polarToCartesian(polar2, alpha2);
			const [x4,y4,z4] = polarToCartesian(polar1, alpha2);
			let r = Math.sin(i * 3712 + j * 34857 + 1) * .5 + .5;
            let g = Math.sin(i * 9321 + j * 27543 + 2) * .5 + .5;
            let b = Math.sin(i * 1268 + j * 12771 + 7) * .5 + .5;
			r=.8;
			g=.1;
			b=.9;


			let [nx,ny,nz] = crossProduct(x1,y1,z1,x2,y2,z2,x3,y3,z3);
			if (j==strips-1){
				[nx,ny,nz] = crossProduct(x1,y1,z1,x2,y2,z2,x4,y4,z4);
			}
			// storeQuad(vertices, x1, y1, z1, nx, ny, nz,
			// 	x2, y2, z2, nx, ny, nz,
			// 	x3, y3, z3, nx, ny, nz,
			// 	x4, y4, z4, nx, ny, nz,
			// 	r, g, b);

				
			
			const nx1 = x1;
			const ny1 = y1;
			const nz1 = z1;			
			const nx2 = x2;
			const ny2 = y2;
			const nz2 = z2;
			const nx3 = x3;
			const ny3 = y3;
			const nz3 = z3;
			const nx4 = x4;
			const ny4 = y4;
			const nz4 = z4;	
			storeQuad(vertices, x1, y1, z1, nx1, ny1, nz1,
								x2, y2, z2, nx2, ny2, nz2,
								x3, y3, z3, nx3, ny3, nz3,
								x4, y4, z4, nx4, ny4, nz4,
								r, g, b,1);	
								
		}
	}
	drawColorNormalVertices(gl, shaderProgram, vertices, gl.TRIANGLES);
}

function crossProduct(x1,y1,z1,x2,y2,z2,x3,y3,z3){
	const ux = x2-x1;
	const uy = y2-y1;
	const uz = z2-z1;
	const vx = x3-x1;
	const vy = y3-y1;
	const vz = z3-z1;
	const nx = uy*vz-uz*vy;
	const ny = -(ux*vz-uz*vx);
	const nz = ux*vy-uy*vx;
	return [nx,ny,nz];
}


function setObservationView(gl, shaderProgram, canvasAspect, eye,WIDTH,HEIGHT) {
	const projectionMatrix = mat4.create();
	const fov = 90 * Math.PI / 180;
	const near = .1;
	const far = 100;
	mat4.perspective(projectionMatrix, fov, canvasAspect, near, far);

	const lookAtMatrix = mat4.create();
	const at = [HEIGHT/2,WIDTH/2,0];
	mat4.lookAt(lookAtMatrix, eye, at, [0, 0, 1]);
	mat4.multiply(projectionMatrix, projectionMatrix, lookAtMatrix);

	const projectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionMatrix);
}
function setRatsView(gl, shaderProgram,WIDTH,HEIGHT,canvas,rat){
	const projectionMatrix = mat4.create();
	const fov = 90 * Math.PI / 180;
	const canvasAspect = canvas.clientWidth / canvas.clientHeight
	const near = .1;
	const far = 40;
	mat4.perspective(projectionMatrix, fov, canvasAspect, near, far);

	
	const lookAtMatrix = mat4.create();
	const eye = [rat.x,rat.y, rat.z];
	let distanceahead = .25;
	let yawX = Math.cos(rat.degrees * Math.PI / 180);
	let yawY = Math.sin(rat.degrees * Math.PI / 180);

	// Adjust the Z (up/down) based on the pitch
	// Assuming rat.z is the height and rat.angle is the pitch
	let pitchZ = rat.z + Math.sin(rat.angle);

	// Combine these to form the "at" vector
	// Note: This might require adjustment based on your camera system and how it interprets these values
	const at = [
		rat.x + yawX,  // X direction based on yaw
		rat.y + yawY,  // Y direction based on yaw
		pitchZ         // Z direction adjusted based on pitch
	];
	const up = [0,0,1];
	mat4.lookAt(lookAtMatrix, eye, at, up);
	mat4.multiply(projectionMatrix, projectionMatrix, lookAtMatrix);

	// Move the eye position back a little
	const eyeOffset = vec3.create();

	const projectionMatrixUniformLocation = gl.getUniformLocation(shaderProgram, "uProjectionMatrix");
	gl.uniformMatrix4fv(projectionMatrixUniformLocation, false, projectionMatrix);
	
}
