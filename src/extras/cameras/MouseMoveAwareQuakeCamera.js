/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 * @author tilmanb
 *
 * parameters = {
 *  fov: <float>,
 *  aspect: <float>,
 *  near: <float>,
 *  far: <float>,
 *  target: <THREE.Object3D>,

 *  movementSpeed: <float>,
 *  lookSpeed: <float>,

 *  noFly: <bool>,
 *  lookVertical: <bool>,
 *  autoForward: <bool>,

 *  constrainVertical: <bool>,
 *  verticalMin: <float>,
 *  verticalMax: <float>,
 
 *  heightSpeed: <bool>,
 *  heightCoef: <float>,
 *  heightMin: <float>,
 *  heightMax: <float>,

 *  domElement: <HTMLElement>,
 * }
 */

THREE.MouseMoveAwareQuakeCamera = function ( parameters ) {

	THREE.Camera.call( this, parameters.fov, parameters.aspect, parameters.near, parameters.far, parameters.target );

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;

	this.noFly = false;
	this.lookVertical = true;
	this.autoForward = false;

	this.activeLook = true;

	this.heightSpeed = false;
	this.heightCoef = 1.0;
	this.heightMin = 0.0;

	this.constrainVertical = false;
	this.verticalMin = 0;
	this.verticalMax = 3.14;
	
	this.domElement = document;

	if ( parameters ) {

		if ( parameters.movementSpeed !== undefined ) this.movementSpeed = parameters.movementSpeed;
		if ( parameters.lookSpeed !== undefined ) this.lookSpeed  = parameters.lookSpeed;
		if ( parameters.noFly !== undefined ) this.noFly = parameters.noFly;
		if ( parameters.lookVertical !== undefined ) this.lookVertical = parameters.lookVertical;

		if ( parameters.autoForward !== undefined ) this.autoForward = parameters.autoForward;

		if ( parameters.activeLook !== undefined ) this.activeLook = parameters.activeLook;

		if ( parameters.heightSpeed !== undefined ) this.heightSpeed = parameters.heightSpeed;
		if ( parameters.heightCoef !== undefined ) this.heightCoef = parameters.heightCoef;
		if ( parameters.heightMin !== undefined ) this.heightMin = parameters.heightMin;
		if ( parameters.heightMax !== undefined ) this.heightMax = parameters.heightMax;
		
		if ( parameters.constrainVertical !== undefined ) this.constrainVertical = parameters.constrainVertical;
		if ( parameters.verticalMin !== undefined ) this.verticalMin = parameters.verticalMin;
		if ( parameters.verticalMax !== undefined ) this.verticalMax = parameters.verticalMax;

		if ( parameters.domElement !== undefined ) this.domElement = parameters.domElement;

	}

	this.autoSpeedFactor = 0.0;

        this.windowHalfX = window.innerWidth / 2;
	this.windowHalfY = window.innerHeight / 2;


	this.mouseX = 0;
	this.lastMouseX = windowHalfX;
	this.mouseY = 0;
	this.lastMouseY = windowHalfY;

	this.movementTimeout = undefined;
	this.decaySteps = undefined;
	this.decayInterval = undefined;

	this.lat = 0;
	this.lon = 0;
	this.phi = 0;
	this.theta = 0;

	this.moveForward = false;
	this.moveBackward = false;
	this.moveLeft = false;
	this.moveRight = false;
	this.freeze = false;

	this.mouseDragOn = false;

	this.onMouseDown = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = true; break;
				case 2: this.moveBackward = true; break;

			}

		}

		this.mouseDragOn = true;

	};

	this.onMouseUp = function ( event ) {

		event.preventDefault();
		event.stopPropagation();

		if ( this.activeLook ) {

			switch ( event.button ) {

				case 0: this.moveForward = false; break;
				case 2: this.moveBackward = false; break;

			}

		}

		this.mouseDragOn = false;

	};

	this.startCameraMotionDecay = function ( x,y ) {
		this.lastMouseX = this.windowHalfX; // set these to x and y for relative positions
		this.lastMouseY = this.windowHalfY;
		this.decayInterval = window.setInterval(function(that) { that.cameraMotionDecay() } , 50, this);
	}

	this.cameraMotionDecay = function ( ) {
		if ( this.decaySteps <= 0 ) {
			this.stopCameraMotion();
		}
		this.decaySteps--;
		this.mouseX *= 0.65;
		this.mouseY *= 0.65
	}

	this.stopCameraMotion = function ( ) {
		this.mouseX = 0;
		this.mouseY = 0;
		window.clearInterval(this.decayInterval);
	}

	this.onMouseMove = function ( event ) {
		window.clearTimeout(this.movementTimeout);
		window.clearInterval(this.decayInterval);
		this.mouseX = event.clientX - this.lastMouseX;
		this.mouseY = event.clientY - this.lastMouseY;
		this.decaySteps = 10;
		this.movementTimeout = window.setTimeout(function(that,x,y) { that.startCameraMotionDecay(x,y) } , 250, this, event.clientX, event.clientY);

	};

	this.onKeyDown = function ( event ) {

		switch( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = true; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = true; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = true; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = true; break;
			
			case 81: this.freeze = !this.freeze; break;

		}

	};

	this.onKeyUp = function ( event ) {

		switch( event.keyCode ) {

			case 38: /*up*/
			case 87: /*W*/ this.moveForward = false; break;

			case 37: /*left*/
			case 65: /*A*/ this.moveLeft = false; break;

			case 40: /*down*/
			case 83: /*S*/ this.moveBackward = false; break;

			case 39: /*right*/
			case 68: /*D*/ this.moveRight = false; break;

		}

	};

	this.update = function() {

		if ( !this.freeze ) {
			

			if ( this.heightSpeed ) {
	
				var y = clamp( this.position.y, this.heightMin, this.heightMax ),
					delta = y - this.heightMin;
	
				this.autoSpeedFactor = delta * this.heightCoef;
	
			} else {
	
				this.autoSpeedFactor = 0.0;
	
			}
	
			if ( this.moveForward || this.autoForward ) this.translateZ( - ( this.movementSpeed + this.autoSpeedFactor ) );
			if ( this.moveBackward ) this.translateZ( this.movementSpeed );
			if ( this.moveLeft ) this.translateX( - this.movementSpeed );
			if ( this.moveRight ) this.translateX( this.movementSpeed );
	
			var actualLookSpeed = this.lookSpeed;
	
			if ( !this.activeLook ) {
	
				actualLookSpeed = 0;
	
			}
	
			this.lon += this.mouseX * actualLookSpeed;
			if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed;
	
			this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
			this.phi = ( 90 - this.lat ) * Math.PI / 180;
			this.theta = this.lon * Math.PI / 180;
	
			var targetPosition = this.target.position,
				position = this.position;
	
			targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
			targetPosition.y = position.y + 100 * Math.cos( this.phi );
			targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );
		}

		this.lon += this.mouseX * actualLookSpeed;
		if( this.lookVertical ) this.lat -= this.mouseY * actualLookSpeed;

		this.lat = Math.max( - 85, Math.min( 85, this.lat ) );
		this.phi = ( 90 - this.lat ) * Math.PI / 180;
		this.theta = this.lon * Math.PI / 180;

		if ( this.constrainVertical ) {

			this.phi = map_linear( this.phi, 0, 3.14, this.verticalMin, this.verticalMax );
			
		}
		
		var targetPosition = this.target.position,
			position = this.position;

		targetPosition.x = position.x + 100 * Math.sin( this.phi ) * Math.cos( this.theta );
		targetPosition.y = position.y + 100 * Math.cos( this.phi );
		targetPosition.z = position.z + 100 * Math.sin( this.phi ) * Math.sin( this.theta );

		this.supr.update.call( this );

	};


	this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

	this.domElement.addEventListener( 'mousemove', bind( this, this.onMouseMove ), false );
	this.domElement.addEventListener( 'mousedown', bind( this, this.onMouseDown ), false );
	this.domElement.addEventListener( 'mouseup', bind( this, this.onMouseUp ), false );
	this.domElement.addEventListener( 'keydown', bind( this, this.onKeyDown ), false );
	this.domElement.addEventListener( 'keyup', bind( this, this.onKeyUp ), false );

	function bind( scope, fn ) {

		return function () {

			fn.apply( scope, arguments );

		};

	};

	function map_linear( x, sa, sb, ea, eb ) {
		
		return ( x  - sa ) * ( eb - ea ) / ( sb - sa ) + ea;
		
	};
	
	function clamp_bottom( x, a ) {

		return x < a ? a : x;

	};

	function clamp( x, a, b ) {

		return x < a ? a : ( x > b ? b : x );

	};

};


THREE.MouseMoveAwareQuakeCamera.prototype = new THREE.Camera();
THREE.MouseMoveAwareQuakeCamera.prototype.constructor = THREE.MouseMoveAwareQuakeCamera;
THREE.MouseMoveAwareQuakeCamera.prototype.supr = THREE.Camera.prototype;


THREE.MouseMoveAwareQuakeCamera.prototype.translate = function ( distance, axis ) {

	this.matrix.rotateAxis( axis );

	if ( this.noFly ) {

		axis.y = 0;

	}

	this.position.addSelf( axis.multiplyScalar( distance ) );
	this.target.position.addSelf( axis.multiplyScalar( distance ) );

};
