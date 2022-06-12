"use strict"

// Canvas ----------------------------------------------------------
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerHeight;
canvas.height = window.innerHeight;


var imageWidth;
var imageHeight;
var player;
var menu;
var shop;
var hud;
var endGame;
var spawner;
var playerBullets = [];
var enemiesBullets = [];
var effects = [];
var marks = [];
// var enemies = [];
var tanks = [];
var framesCounter = 1;
var sound;

var state = {
	game: false,
	shop: false,
	endGame: false,
	menu: true,
}


//handle mouse
let canvasPosition = canvas.getBoundingClientRect();
const keyboard = {
	keyA: false,
	keyD: false,
	keyW: false,
	keyS: false,
	key1: false,
	key2: false,
	key3: false
}

const mouse = {
	x: null,
	y: null,
	click: false
}

canvas.addEventListener("mousedown", function () {
	mouse.click = true;
	mouse.x = event.x - canvasPosition.left;
	mouse.y = event.y - canvasPosition.top;

	// + window.pageYOffset - 7;
})

canvas.addEventListener("mouseup", function () {
	mouse.click = false;

});

canvas.addEventListener("mousemove", function (e) {
	mouse.x = e.x - canvasPosition.left;
	mouse.y = e.y - canvasPosition.top;

	// console.log(mouse.x + " " + mouse.y);
});

document.addEventListener("keydown", function (event) {
	// console.log(event)
	if (event.key == "a") keyboard.keyA = true;
	if (event.key == "d") keyboard.keyD = true;
	if (event.key == "w") keyboard.keyW = true;
	if (event.key == "s") keyboard.keyS = true;
	if (event.key == "1") keyboard.key1 = true;
	if (event.key == "2") keyboard.key2 = true;
	if (event.key == "3") keyboard.key3 = true;
	if (event.key == "h") keyboard.keyH = true;
	if (event.key == "m") keyboard.keyM = true;

}, false);

document.addEventListener("keyup", function (event) {
	// console.log(event);
	if (event.key == "a") keyboard.keyA = false;
	if (event.key == "d") keyboard.keyD = false;
	if (event.key == "w") keyboard.keyW = false;
	if (event.key == "s") keyboard.keyS = false;
	if (event.key == "1") keyboard.key1 = false;
	if (event.key == "2") keyboard.key2 = false;
	if (event.key == "3") keyboard.key3 = false;
	if (event.key == "h") keyboard.keyH = false;
	if (event.key == "m") keyboard.keyM = false;

	//button for shop/pause
	if (event.key == "p" && state.game) {
		state.shop = true;
		state.game = false;
	} else if (event.key == "p" && state.shop) {
		state.shop = false;
		state.game = true;
	}

	// console.log(event);	
}, false);


//Delay to allow for load of resources
setTimeout(function () {
	canvas.style.cursor = "none"
	init();
	animate();

}, 2000);


class Player {
	constructor(x, y, width, height) {
		this.x = x,
			this.y = y,
			this.width = width,
			this.height = height,
			this.angle = 0,
			this.health = 100,
			this.tick = 0, //used for turrents delay
			this.shootingsound = document.createElement("audio");
		this.isShooting = false;

		//Turret image
		this.turretImgStartX,
			this.turretImgStartY,
			this.turretImgWidth = playerWeapons.width / 3,
			this.turretImgHeight = (playerWeapons.height - 142) / 3,
			this.turretRatio = this.turretImgHeight / this.turretImgWidth,
			this.turretScaleX,
			this.turretScaleY,

			this.isReady = false; //Initial settings

		//Weapons
		this.isWeaponUpdate = true; //If upgrade via shop

		//3 types, 3 tiers each
		this.weaponType = 1;
		this.weaponTier = 1;

		//Turret settings : assigned in updateWeapon()
		this.adjustment = 12; // for left and right turret
		this.bulletSize;
		this.bulletType;
		this.bulletSpeed;
		this.bulletBlast;
		this.bulletDamage;

		this.isOverheatedT1 = false; //if overheated dispays message
		this.coolDownT1 = 0;
		this.coolDownLimitT1 = 300;

		this.isOverheatedT2 = false;//if overheated dispays message
		this.coolDownT2 = 0;
		this.coolDownLimitT2 = 300;

		this.turretLeft = true;
		this.turretLeftDelay = 0;

		this.turretRight = true;
		this.turretRightDelay = 0;

		this.turretMiddle = true;
		this.turretMiddleDelay = 0;
	}

	update() {
		//Initial image setting
		if (this.isReady == false) {
			this.turretImgStartX = this.weaponTier * this.turretImgWidth - this.turretImgWidth;
			this.turretImgStartY = this.weaponType * this.turretImgHeight - this.turretImgHeight;

			this.turretScaleX = this.turretImgWidth / (this.turretImgWidth / this.width);//desired width 
			this.turretScaleY = this.turretImgHeight / (this.turretImgHeight / (this.width * this.turretRatio)); //desired height


			if (this.weaponType == 1) {
				this.shootingsound = sound.canonSound;

			} else if (this.weaponType == 2) {
				this.shootingsound = sound.minigunSound;

			} else if (this.weaponType == 3) this.shootingsound = sound.rocketFiringSound;



			this.isReady = true;
		}

		if (this.isWeaponUpdate) {
			this.updateWeapons();
			this.isWeaponUpdate = false;
		}


		let theta = findAngle(this.x, this.y, mouse.x, mouse.y);
		this.angle = theta - 1.5708;

		//debuging
		// if (framesCounter % 20 == 0) {
		// }


		//Updates overheating, if weapons are overheated
		if (this.isOverheatedT1 || this.weaponType != 1) {
			this.coolDownT1 -= 2;
			if (this.coolDownT1 <= 0) {
				this.coolDownT1 = 0;
				this.isOverheatedT1 = false;
			}
		}

		if (this.isOverheatedT2 || this.weaponType != 2) {
			this.coolDownT2 -= 2;
			if (this.coolDownT2 <= 0) {
				this.coolDownT2 = 0;
				this.isOverheatedT2 = false;
			}
		}

		if (mouse.click == false && !this.isOverheatedT1 && !this.isOverheatedT2) {
			this.coolDownT1 -= 2;
			this.coolDownT2 -= 2;

			if (this.coolDownT1 <= 0) this.coolDownT1 = 0;
			if (this.coolDownT2 <= 0) this.coolDownT2 = 0;
		}


		//Firing turrets
		if (mouse.click && checkDistance(this.x, this.y, mouse.x, mouse.y) > 100 && this.tick > 50) {
			let check = false; //decides whether shooting allowed based on overheating of turrets status.
			//Checks for coolDown and skips the order to fire.
			if (this.isOverheatedT1) {
				if (this.coolDownT1 > 0) check = true;
			} else if (this.isOverheatedT2) {
				if (this.coolDownT2 > 0) check = true;
			}

			//Finding angles
			if (!check) {
				let centralAngle = findAngle(this.x, this.y, mouse.x, mouse.y); //angle player to mouse
				let leftAngle = findAngle(this.x, this.y, this.x - this.adjustment, this.y - 30); //left turret angle*
				let rightAngle = findAngle(this.x, this.y, this.x + this.adjustment, this.y - 30); //right turret angle*

				let centralX = this.x - (45 * Math.cos(centralAngle)); //turrets shoot from the end of barrel, not center of player
				let centralY = this.y - (45 * Math.sin(centralAngle));

				let leftX = this.x - (45 * Math.cos(leftAngle - (1.5708 - centralAngle))); // left turret barrel angle
				let leftY = this.y - (45 * Math.sin(leftAngle - (1.5708 - centralAngle)));

				let rightX = this.x - (45 * Math.cos(rightAngle - (1.5708 - centralAngle))); // right turret barrel angle
				let rightY = this.y - (45 * Math.sin(rightAngle - (1.5708 - centralAngle)));

				//3 modes of firing with delay (3, 2, 1 turrents setup, sides varries
				//general idea of delays, turret(t)1 fires:now/3s, t2:1s, :t3:2s 
				if (this.turretLeft && this.turretRight && this.turretMiddle) {
					// 3 turrets
					if (this.turretLeftDelay <= framesCounter) {
						playerBullets.push(new Bullet(leftX, leftY, mouse.x, mouse.y, this.bulletSize, this.bulletSpeed, this.bulletBlast, playerBullets, "player", this.bulletDamage));
						this.turretLeftDelay = framesCounter + this.bulletReload;
						this.turretMiddleDelay = framesCounter + this.bulletReload / 3;
						this.turretRightDelay = framesCounter + this.bulletReload / 3 * 2;

					} else if (this.turretMiddleDelay <= framesCounter) {
						playerBullets.push(new Bullet(centralX, centralY, mouse.x, mouse.y, this.bulletSize, this.bulletSpeed, this.bulletBlast, playerBullets, "player", this.bulletDamage));
						this.turretMiddleDelay = framesCounter + this.bulletReload;

					} else if (this.turretRightDelay <= framesCounter) {
						playerBullets.push(new Bullet(rightX, rightY, mouse.x, mouse.y, this.bulletSize, this.bulletSpeed, this.bulletBlast, playerBullets, "player", this.bulletDamage));
						this.turretRightDelay = framesCounter + this.bulletReload;
					}

				} else if (this.turretLeft && this.turretRight && !this.turretMiddle) {
					//2 turrets
					if (this.turretLeftDelay <= framesCounter) {
						playerBullets.push(new Bullet(leftX, leftY, mouse.x, mouse.y, this.bulletSize, this.bulletSpeed, this.bulletBlast, playerBullets, "player", this.bulletDamage));
						this.turretLeftDelay = framesCounter + this.bulletReload;
						this.turretRightDelay = framesCounter + this.bulletReload / 2;
					} else if (this.turretRightDelay <= framesCounter) {
						playerBullets.push(new Bullet(rightX, rightY, mouse.x, mouse.y, this.bulletSize, this.bulletSpeed, this.bulletBlast, playerBullets, "player", this.bulletDamage));
						this.turretRightDelay = framesCounter + this.bulletReload;
					}

				} else if (!this.turretLeft && this.turretRight && !this.turretMiddle) {
					//right turret only
					if (this.turretRightDelay <= framesCounter) {
						playerBullets.push(new Bullet(rightX, rightY, mouse.x, mouse.y, this.bulletSize, this.bulletSpeed, this.bulletBlast, playerBullets, "player", this.bulletDamage));
						this.turretRightDelay = framesCounter + this.bulletReload;
					}

				} else {
					// Middle turret only
					if (this.turretMiddleDelay <= framesCounter) {
						playerBullets.push(new Bullet(centralX, centralY, mouse.x, mouse.y, this.bulletSize, this.bulletSpeed, this.bulletBlast, playerBullets, "player", this.bulletDamage));
						this.turretMiddleDelay = framesCounter + this.bulletReload;
						// console.log(this.bulletDamage);
					}
				}

				//Updates overheating of weapons
				if (this.weaponType == 1) {
					this.coolDownT1++;
					if (this.coolDownT1 == this.coolDownLimitT1) this.isOverheatedT1 = true;

				} else if (this.weaponType == 2) {
					this.coolDownT2++;
					if (this.coolDownT2 == this.coolDownLimitT2) this.isOverheatedT2 = true;
				}


			}
		}

		//Controls for debbuging
		if (keyboard.keyA) {
			this.x -= 5;
			if (this.x - this.width / 2 <= 0) this.x = 0 + this.width / 2;
		}

		if (keyboard.keyD) {
			this.x += 5;
			if (this.x + this.width / 2 >= canvas.width) this.x = canvas.width - this.width / 2;
		}

		if (keyboard.keyW) {
			this.y -= 5;
			if (this.y - this.height / 2 <= 0) this.y = 0 + this.height / 2;
		}

		if (keyboard.keyS) {
			this.y += 5;
			if (this.y + this.height / 2 >= canvas.height) this.y = canvas.height - this.height / 2;
		}

		//buy health key
		if (keyboard.keyH && hud.cash >= 100 && hud.playerHealth < 100) {
			hud.cash -= 100;
			hud.playerHealth = 100;
			keyboard.keyH = false
		}

		//if toolbar button, quick weapon changing.
		if (shop.turretUnlocked > 0 && keyboard.key1) {
			setWeapon(1, shop.turretUnlocked);
		} else if (shop.machinegunUnlocked > 0 && keyboard.key2) {
			setWeapon(2, shop.machinegunUnlocked);
		} else if (shop.rocketUnlocked > 0 && keyboard.key3) {
			setWeapon(3, shop.rocketUnlocked);
		}


		//sets new weapon after toolbar use
		function setWeapon(type, unlocked) {
			player.weaponType = type;
			player.weaponTier = unlocked;
			player.isWeaponUpdate = true;
			player.isReady = false;
			shop.weaponTypeSelected = type;
			shop.weaponTierSelected = unlocked;
			mouse.click = false;
		}



		this.tick++;
		this.draw();
	}

	draw() {
		//base of turret
		ctx.drawImage(tower, this.x - this.width / 2, this.y - this.height / 2, 100, 100); //draws in the middle of x/y

		//turret rotation and image.
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.angle);
		ctx.drawImage(playerWeapons, this.turretImgStartX, this.turretImgStartY,
			this.turretImgWidth, this.turretImgHeight, 0 - this.turretScaleX / 2, 0 - this.turretScaleY / 2, this.turretScaleX, this.turretScaleY);
		ctx.restore();

		let angle;
		let lineX;
		let lineY;

		//Debug
		// if (this.tick % 200 == 0) {
		// 	console.log(this.collisionX + " " + this.collisionY);
		// }
	}

	//updates weapons after shop upgrade also sets weapons parameters
	updateWeapons() {
		let wtype = this.weaponType;
		let wTier = this.weaponTier;
		this.adjustment = 12;

		this.turretLeft = false;
		this.turretRight = false;
		this.turretMiddle = false;

		this.bulletSpeed = 0;
		this.bulletBlast = 0;
		this.bulletReload = 0;
		this.bulletSize = 0;
		this.bulletDamage = 0;

		//Weapons set up
		if (wtype == 1) {
			//turret
			this.bulletSpeed = 7;
			this.bulletBlast = 75;
			this.bulletReload = 40;
			this.bulletSize = 30;
			this.bulletDamage = 35;

			if (wTier == 1) {
				this.turretMiddle = true;

			} else if (wTier == 2) {
				this.turretLeft = true;
				this.turretRight = true;

			} else { //wTier == 3
				this.turretMiddle = true;
				this.bulletSpeed = 7;
				this.bulletReload = 90;
				this.bulletBlast = 120;
				this.bulletSize = 40;
				this.bulletDamage = 90;
			}

		} else if (wtype == 2) {
			//machinegun
			this.bulletSpeed = 10;
			this.bulletBlast = 0;
			this.bulletSize = 30;
			this.bulletReload = 10;
			this.bulletDamage = 4;


			if (wTier == 1) {
				this.adjustment = 9;
				this.turretRight = true;



			} else if (wTier == 2) {
				this.turretLeft = true;
				this.turretRight = true;
				this.bulletDamage = 5;

			} else { //wTier == 3
				this.turretRight = true;
				this.bulletReload = 3;
				this.bulletDamage = 3;
			}

		} else { //wtype == 3
			//rocket
			this.bulletSpeed = 6;
			this.bulletBlast = 90;
			this.bulletReload = 60;
			this.bulletSize = 25;
			this.bulletDamage = 30;

			if (wTier == 1) {
				this.turretMiddle = true;

			} else if (wTier == 2) {
				this.adjustment = 11;
				this.turretLeft = true;
				this.turretRight = true;

			} else { //wTier == 3
				this.turretMiddle = true;
				this.turretLeft = true;
				this.turretRight = true;

			}
		}

		//Bonus is 0 - 20; //
		if (wtype == 1) {
			this.bulletDamage += shop.bnsDamTurret / 2;// shop adds 2.5, so its extra 1.25
			this.bulletSpeed += shop.bnsSpdTurret / 5; // shop adds 1  /5 = 0.2
			this.bulletReload -= shop.bnsRelTurret / 5; // shop takes 5 /5 = 1
			this.bulletBlast += shop.bnsBstTurret; //shop adds 5
		} else if (wtype == 2) {
			this.bulletDamage += shop.bnsDamMachinegun / 2;
			this.bulletSpeed += shop.bnsSpdMachinegun / 5;
			this.bulletReload -= shop.bnsRelMachinegun / 5;
		} else if (wtype == 3) {
			this.bulletDamage += shop.bnsDamRocket / 2;
			this.bulletSpeed += shop.bnsSpdRocket / 5;
			this.bulletReload -= shop.bnsRelRocket / 5;
			this.bulletBlast += shop.bnsBstRocket;
		}

	}
}

class Bullet {
	constructor(x, y, tx, ty, radius, speed, splash, array = [], team, damage) {
		this.x = x,
			this.y = y,
			this.tx = tx,
			this.ty = ty,

			this.bulletSpread = 20; //if 20 random between -10 and 10
		this.bulletSpreadDistance = 1000; //Scaling of bulletSpread vs distance, if 100 and bspread 20, at 100dis it will spread between -10 & +10
		this.bulletSpreadX = 0; //random spread based on bulletSpread
		this.bulletSpreadY = 0; //random spread based on bulletSpread
		this.distance = checkDistance(this.x, this.y, this.tx, this.ty); //dis to target
		this.enemyID;

		this.radius = radius, //bullet size
			this.speed = speed,	//bullet speed
			this.splash = splash, //explosion range
			this.angle = 0, //target angle
			this.currentAngle = 0; //front of tank angle on the grid

		this.directionX, //movement dirrection
			this.directionY,


			// this.moveFrames; //remove
			this.image = bulletsImg;
		this.bullet; //sets bullet image 1 - 11*
		this.array = array; //which array it belongs too, 
		this.team = team //team name, probably could have used array
		this.damage = damage;

		this.id = Math.floor(Math.random() * 5000),
			this.isReady = false;
		this.target;
		this.targetId;
		this.targetNo;
		// this.lockedTimer = framesCounter; //was supposed to be used for missle delay before it autoaim
		this.sound = document.createElement("audio");
	}

	update() {
		//Initial sets up correct images
		if (!this.isReady) {

			//Changes bullet type
			if (this.team == "tank") {
				this.bullet = 1;
				playSound(sound.tankShootingSound);

			} else if (this.team == "player") {
				if (player.weaponType == 1) this.bullet = 9;
				else if (player.weaponType == 2) this.bullet = 10;
				else this.bullet = 11;

				playSound(player.shootingsound);

				if (player.weaponType != 3) {
					//extra bullet spread
					let randomSpreadX = Math.random() * 2 * this.bulletSpread;
					let randomSpreadY = Math.random() * 2 * this.bulletSpread;

					let ratio = this.distance / this.bulletSpreadDistance

					//for x +-
					if (randomSpreadX > this.bulletSpread) {
						this.bulletSpreadX = (randomSpreadX - this.bulletSpread) * ratio
						this.tx += randomSpreadX - this.bulletSpread;

					} else {
						this.bulletSpreadX = -(randomSpreadX * ratio);
						this.tx -= randomSpreadX;
					}

					//for y +-
					if (randomSpreadY > this.bulletSpread) {
						this.bulletSpreadY = (randomSpreadY - this.bulletSpread) * ratio;
						this.ty += randomSpreadY - this.bulletSpread;
					}
					else {
						this.bulletSpreadY = -(randomSpreadY * ratio);
						this.ty -= randomSpreadY;
					}

				} else {
					//If weapon type 3, set starting angle to be where mouse points, so 
					// the rocket does not go directly to target through player.
					this.angle = findAngle(player.x, player.y, mouse.x, mouse.y) - 1.5708;
				}
			}
			this.isReady = true;
		}


		//Checks for rocket status if tanks disapear, re aiming etc.
		if (player.weaponType == 3 && this.team == "player") {
			let isChangingTarget;
			if (tanks.length != 0 && this.target == undefined) {
				isChangingTarget = true;
			} else if (tanks.length == 0) {
				isChangingTarget = false;

			} else if (tanks.length - 1 == this.targetNo && tanks[this.targetNo].id != this.targetId) {
				isChangingTarget = true;

			} else if (tanks.length < this.targetNo) {
				isChangingTarget = true;

			}

			//Finds new target based on mouse distance.
			let shortesDistance = 0;
			if (isChangingTarget) {
				for (let i = 0; i < tanks.length; i++) {
					let distance = checkDistance(mouse.x, mouse.y, tanks[i].x, tanks[i].y);
					if (distance < shortesDistance || shortesDistance == 0) {
						shortesDistance = distance;
						this.target = tanks[i];
						this.targetId = tanks[i].id;
						this.targetNo = i;
						this.tx = tanks[i].x;
						this.ty = tanks[i].y;
					}
				}
			}

			//Finding angle to target
			if (tanks.length == 0 && this.target == undefined) {
				this.target = { x: this.tx, y: this.ty };
			}
			let theta = findAngle(this.x, this.y, this.target.x, this.target.y);

			//Finding direction to target
			if (player.weaponType == 3 && this.team == "player") {
				// x & y (this angle to xy)
				let toPlayerX = this.x - (100 * Math.cos(this.distance + 0));
				let toPlayerY = this.y - (100 * Math.sin(this.distance + 0));

				let turningAngle = (2 * Math.PI / 180); // how far is missle turn angle per frame.

				//front of tank angle
				let centraX = this.x - (100 * Math.cos(this.angle + 1.5708));
				let centraY = this.y - (100 * Math.sin(this.angle + 1.5708));
				//current angle / front of tank
				this.currentAngle = Math.atan2(centraY, centraX);

				//Detecting whether objects are on left or right (nodes), creates nodes on left and right of this object.
				let detLX = this.x - (50 * Math.cos(this.angle));
				let detLY = this.y - (50 * Math.sin(this.angle));

				let detRX = this.x - (50 * Math.cos(this.angle + 1.5708 * 2));
				let detRY = this.y - (50 * Math.sin(this.angle + 1.5708 * 2));


				//left / right x,y used to calculate movement dirrection.
				let lX = this.x - (100 * Math.cos(this.angle - turningAngle + 1.5708));
				let lY = this.y - (100 * Math.sin(this.angle - turningAngle + 1.5708));

				let rX = this.x - (100 * Math.cos(this.angle + turningAngle + 1.5708));
				let rY = this.y - (100 * Math.sin(this.angle + turningAngle + 1.5708));

				// checks whether player is on left/right.						
				let onLeft = checkDistance(detLX, detLY, this.target.x, this.target.y);
				let onRight = checkDistance(detRX, detRY, this.target.x, this.target.y);

				//Turns this object depending where the player is.
				if (onLeft < onRight) {
					this.directionX = lX - this.x;
					this.directionY = lY - this.y;
					this.angle -= turningAngle;


				} else if (onRight < onLeft) {
					this.directionX = rX - this.x;
					this.directionY = rY - this.y;
					this.angle += turningAngle;
				}

				// Debugging
				// if (framesCounter % 50 == 0) {
				// 	console.log(onLeft + " " + onRight);
				// 	console.log(tanks.length + " " + this.targetNo);
				// }

			}
		}

		//Decides whether shots should be ranged or continued
		if ((this.directionX == null && this.directionY == null && player.weaponType == 2)
			|| player.weaponType == 1 || this.team == "tank") {
			//ranged will stay at target possition.

			//Finding angle
			let theta = findAngle(this.x, this.y, this.tx + this.bulletSpreadX, this.ty + this.bulletSpreadY);
			this.angle = theta - 1.5708;

			this.directionX = this.tx + this.bulletSpreadX - this.x;
			this.directionY = this.ty + this.bulletSpreadY - this.y;
		} else if (player.weaponType == 3 && this.team == "player") {
			// this.directionX = this.tx + this.bulletSpreadX - this.x;
			// this.directionY = this.ty + this.bulletSpreadY - this.y;

		}

		//Finding distance
		var length = Math.sqrt(this.directionX * this.directionX + this.directionY * this.directionY);
		this.directionX /= length;
		this.directionY /= length;


		//Accelerator
		this.x += this.directionX * this.speed;
		this.y += this.directionY * this.speed;
		// this.moveFrames --; //remove

		//Removes this object and creates explosion
		let isDead = false;
		if (this.hasCollided || (player.weaponType == 1 || player.weaponType == 3) && (checkDistance(this.x, this.y, this.tx + this.bulletSpreadX, this.ty + this.bulletSpreadY) < 10)) {
			if (this.team == "player") {
				checkExplosion(this.x, this.y, this.damage);
			}

			effects.push(new BulletExplosion(this.x, this.y, this.splash, "bullet", this.team, this.damage));
			remove(this.array, this.id);
			isDead = true;

			this.sound.pause();
			this.sound.currentTime = 0;


			// this.sound.pause();
			// this.sound.onpaused = function () {
			// 	this.parentNode.removeChild(this);
			// }

		}

		if (this.bullet == 11) {
			//play sound
			// if (this.sound.src == "" || this.sound.ended && isDead == false) {
			// 	this.sound.src = rocketFlyingSound.src;
			// 	document.body.appendChild(this.sound);

			// 	this.sound.volume = rocketFlyingSound.volume;
			// 	this.sound.play();

			// 	this.sound.onended = function () {
			// 		this.parentNode.removeChild(this);
			//  	}
			// }

		}







		//Debugger :D
		// if (framesCounter % 100 == 0) {
		// console.log(this.directionX * this.speed);
		// }

		this.draw();
	}

	draw() {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.angle);
		ctx.drawImage(bulletsImg, bulletsImg.width / 11 * this.bullet - bulletsImg.width / 11, 0, 54, 76, 0 - this.radius / 2, 0 - this.radius / 2, this.radius, this.radius)
		ctx.restore();
	}

}

class BulletExplosion {
	constructor(x, y, radius, explosionType, team, damage) {
		this.x = x,
			this.y = y,
			this.radius = radius,
			this.team = team,
			this.speed = 3,
			this.damage = damage,
			this.tick = 0;
		this.animation = 0;
		this.scale = (explosion1.width / 8) / ((explosion1.width / 8) / this.radius);
		this.explosionType = explosionType;
		this.id = Math.floor(Math.random() * 5000);
		this.image;

		this.isReady = false;
	}

	update() {
		//Initial settings
		if (!this.isReady) {
			if (this.explosionType == "tank") {
				this.image = tankExplosion;
				this.speed = 2;

			} else if (this.explosionType == "bullet") {
				this.image = explosion1;
				this.speed = 3;

			} else if (this.explosionType == "explosionMark") {
				this.image = explosionMark;
			}

			this.isReady = true;
		}

		//removes this element after it expired
		if (this.explosionType == "bullet") {
			if (this.animation >= 8) {
				remove(effects, this.id);
			}

		}

		if (this.explosionType == "tank") {
			if (this.animation >= 12) {
				remove(effects, this.id);
			}
		}

		//counter for animation spreadsheet change
		if (this.tick % this.speed == 0) {
			this.animation++;
		}

		this.tick++;
		this.draw();
	}

	draw() {
		//draws explosion image depending on the type.
		if (this.explosionType == "bullet") {
			ctx.drawImage(explosion1, this.animation * explosion1.width / 8 - explosion1.width / 8,
				0, explosion1.width / 8, explosion1.height,
				this.x - this.scale / 2, this.y - this.scale / 2, this.scale, this.scale);
		} else if (this.explosionType == "tank") {
			ctx.drawImage(tankExplosion, this.animation * tankExplosion.width / 16 - tankExplosion.width / 16,
				0, tankExplosion.width / 16, tankExplosion.height,
				this.x - 40, this.y - 50, 80, 100);
		}



	}
}

class Mark {
	constructor(x, y) {
		this.x = x;
		this.y = y;
		this.image = explosionMark;
		this.tick = 0;
		this.animation = 1;
		this.id = Math.floor(Math.random() * 5000);
		this.isRemove = false;

	}

	update() {
		//updates spreadsheeet for a mark left after destruction of a tank
		if (this.tick % 500 == 0) {
			this.animation++;
			if (this.animation == 21) {
				this.isRemove = true;
			}
		}
		this.tick++
		this.draw();
	}

	draw() {
		//draws explosion mark
		ctx.drawImage(explosionMark, this.animation * explosionMark.width / 20 - explosionMark.width / 20,
			0, explosionMark.width / 20,
			explosionMark.height,
			this.x - 50,
			this.y - 50, 100, 100);
	}
}

class Tank {
	constructor(x, y, tankTier, tankType, weaponType) {
		this.x = x,
			this.y = y,
			this.width = 50, //50 normal
			this.height,
			this.speed,
			this.defaulSpeed,
			this.angle, //image angle
			this.tankAngle = 1.5708 * 3; //starting angle
		this.id = Math.floor(Math.random() * 5000),
			this.sound = document.createElement("audio");

		this.tier = tankTier,
			this.tankType = tankType,
			this.weaponType = weaponType,

			//Image display settings
			this.tankImage,
			this.turretImage,

			this.tankImgStartX,
			this.tankImgStartY,
			this.turretImgStartX,
			this.turretImgStartY,
			this.tankImgWidth,
			this.tankImgHeight,
			this.turretImgWidth,
			this.turretImgHeight,

			this.ratio, //ratio for size of the image
			this.tankScaleX,
			this.tankScaleY,

			//Tank HUD
			this.hasCollided = false, //if behind another tank
			this.isInRange = false, //if in range to player

			this.health = 50 + 25 * this.tier + 3 * this.tankType,
			this.maxHealth = this.health,
			this.bulletType;
		this.bulletSpeed;
		this.bulletDamage;
		this.bulletRange;
		this.bulletDelay = 0; //calculated elsewhere.

		this.isReady = false; //initial settings
		this.isDead = false; //if it is dead, spawns effects
		this.deathTimer = 20; //how long it will be dead before being removed
		this.collisionX; // colision X for tailgating
		this.collisionY; // colision Y for tailgating
		this.isDynamicPath = false; //whether its goes to player directly or one way only
		this.currentAngle = 1.5708 * 2; //starting angle
	}

	update() {

		//Initial setup of tank, sets up the correct image
		if (this.isReady == false) {
			if (this.tier == 1) {
				this.tankImage = tankTier1;
				this.turretImage = turretTier1;
			} else if (this.tier == 2) {
				this.tankImage = tankTier2;
				this.turretImage = turretTier2;
			} else if (this.tier == 3) {
				this.tankImage = tankTier3;
				this.turretImage = turretTier3;
			} else if (this.tier == 4) {
				this.tankImage = tankTier4;
				this.turretImage = turretTier4;

			}

			//calculates all settings for image
			this.tankImgWidth = this.tankImage.width / 4;
			this.tankImgHeight = (this.tankImage.height - 84) / 2;

			this.turretImgWidth = this.turretImage.width / 4;
			this.turretImgHeight = (this.turretImage.height) / 2;

			if (this.tankType <= 4) {
				this.tankImgStartX = this.tankType * this.tankImgWidth - this.tankImgWidth;
				this.tankImgStartY = 0;

				this.turretImgStartX = this.tankType * this.turretImgWidth - this.turretImgWidth;
				this.turretImgStartY = 0;
			} else {
				this.tankImgStartX = (this.tankType - 4) * this.tankImgWidth - this.tankImgWidth;
				this.tankImgStartY = this.tankImgHeight;

				this.turretImgStartX = (this.tankType - 4) * this.turretImgWidth - this.turretImgWidth;
				this.turretImgStartY = this.turretImgHeight;
			}
			//height/with ratio
			this.ratio = this.tankImgHeight / this.tankImgWidth;

			this.tankScaleX = this.tankImgWidth / (this.tankImgWidth / this.width);//desired width 
			this.tankScaleY = this.tankImgHeight / (this.tankImgHeight / (this.width * this.ratio)); //desired height
			this.height = this.width * this.ratio;

			//Speed setup, depending on tankType set different settings.
			switch (this.tankType) {
				case 1:
					this.speed = 0.2;
					this.damage = 5 + (this.tier * 2);
					break;
				case 2:
					this.speed = 0.3;
					this.damage = 3 + (this.tier * 2);
					break;
				case 3:
					this.speed = 0.4;
					this.damage = 5 + (this.tier * 2);
					break;
				case 4:
					this.speed = 0.5;
					this.damage = 2 + (this.tier * 2);
					break;
				case 5:
					this.speed = 0.4;
					this.damage = 5 + (this.tier * 2);
					break;
				case 6:
					this.speed = 0.6;
					this.damage = 3 + (this.tier * 2);
					break;
				case 7:
					this.speed = 0.6;
					this.damage = 4 + (this.tier * 2);
					break;
				case 8:
					this.speed = 0.7;
					this.damage = 6 + (this.tier * 2);
					break;
			}

			// random speed, experimental
			this.speed = 0.2 + (Math.random() / 2);
			this.defaulSpeed = this.speed;
			this.isReady = true;

			// console.log("spawn " + this.id)
		}

		//if tanks is not dead
		if (!this.isDead) {

			//Finding angle to player.
			let theta = findAngle(this.x, this.y, player.x, player.y);
			this.angle = theta - 1.5708;

			//Finding direction to player
			if (this.isDynamicPath) {
				// x & y (player angle to xy)
				let toPlayerX = this.x - (100 * Math.cos(theta + 0));
				let toPlayerY = this.y - (100 * Math.sin(theta + 0));

				// let tankAngle = 90*Math.PI/180;
				let turningAngle = (20 * Math.PI / 180) / 40;

				//front of tank
				let centraX = this.x - (100 * Math.cos(this.tankAngle));
				let centraY = this.y - (100 * Math.sin(this.tankAngle));

				//Detecting whether objects are on left or right (nodes)
				let detLX = this.x - (50 * Math.cos(this.tankAngle - 1.5708));
				let detLY = this.y - (50 * Math.sin(this.tankAngle - 1.5708));

				let detRX = this.x - (50 * Math.cos(this.tankAngle + 1.5708));
				let detRY = this.y - (50 * Math.sin(this.tankAngle + 1.5708));


				//left / right x,y used to calculate movement dirrection.
				let lX = this.x - (100 * Math.cos(this.tankAngle - turningAngle));
				let lY = this.y - (100 * Math.sin(this.tankAngle - turningAngle));

				let rX = this.x - (100 * Math.cos(this.tankAngle + turningAngle));
				let rY = this.y - (100 * Math.sin(this.tankAngle + turningAngle));

				// nodes for detecting player on left/right.
				let onLeft = checkDistance(detLX, detLY, player.x, player.y);
				let onRight = checkDistance(detRX, detRY, player.x, player.y);

				//Turns the tank depending where the player is.
				if (this.isInRange == false) {
					if (onLeft < onRight) {
						this.directionX = lX - this.x;
						this.directionY = lY - this.y;
						this.tankAngle -= turningAngle;

					} else {
						this.directionX = rX - this.x;
						this.directionY = rY - this.y;
						this.tankAngle += turningAngle;
					}
				}

				//debug
				// if (framesCounter % 50 == 0) {
				// }

				//debug
				// ctx.moveTo(this.x,this.y);
				// ctx.lineTo(toPlayerX, toPlayerY);
				// ctx.moveTo(this.x,this.y);
				// ctx.lineTo(centraX, centraY);
				// ctx.moveTo(this.x,this.y);
				// ctx.lineTo(lX, lY);
				// ctx.moveTo(this.x,this.y);
				// ctx.lineTo(rX, rY);
				// ctx.moveTo(this.x,this.y);
				// ctx.lineTo(detLX, detLY);
				// ctx.moveTo(this.x,this.y);
				// ctx.lineTo(detRX, detRY);
				// ctx.stroke();

			} else {
				//Going straight down/ one dirrection
				this.directionX = 0;
				this.directionY = 30;
			}


			var length = Math.sqrt(this.directionX * this.directionX + this.directionY * this.directionY);
			this.directionX /= length;
			this.directionY /= length;

			//Updating speed to player
			this.x += this.directionX * this.speed;
			this.y += this.directionY * this.speed;

			//Distance to player
			let dx = this.x - player.x;
			let dy = this.y - player.y;
			let distance = Math.sqrt(dx * dx + dy * dy);

			//if under 400dis do stuff, if 300 shoot.
			if ((distance < 400 + this.id / 50 || canvas.height - this.y < 200) && framesCounter > this.bulletDelay) {
				this.isDynamicPath = true;
				if (distance < 300) {
					enemiesBullets.push(new Bullet(this.x, this.y, player.x, player.y, 30, 4, 40, enemiesBullets, "tank", this.damage));
					this.bulletDelay = framesCounter + 180;
				}
			}

			//Collision
			//Checks area ahead of the tank for collision.
			if (this.isDynamicPath) {
				this.collisionX = this.x - (this.height * Math.cos(this.angle + 1.5708));
				this.collisionY = this.y - (this.height * Math.sin(this.angle + 1.5708));

			} else {
				this.collisionX = this.x - (this.height * Math.cos(1.5708 * 2 + 1.5708));
				this.collisionY = this.y - (this.height * Math.sin(1.5708 * 2 + 1.5708));
			}

			//Sound (can be changed for 3 different sounds)
			if (this.speed != 0 && sound.soundMuted == false) {
				if (this.sound.src == "" || this.sound.ended && this.isDead == false) {
					this.sound.src = sound.tankTracksSound.src;
					document.body.appendChild(this.sound);

					this.sound.volume = sound.tankTracksSound.volume;
					this.sound.play();


				} else if (this.isDead || this.hasCollided || this.isInRange || sound.soundMuted) {

					this.sound.pause();
					this.sound.currentTime = 0;
					// console.log(this.sound.paused);
				}

				this.sound.onended = function () {
					if (this != null) this.parentNode.removeChild(this);
				}
			}

			// Debug collision square
			// ctx.beginPath();
			// ctx.strokeStyle = "blue";
			// ctx.moveTo(this.x, this.y);
			// ctx.lineTo(this.collisionX, this.collisionY);
			// ctx.rect(this.collisionX - 50, this.collisionY-50, 100, 100);
			// ctx.stroke();
		}
		this.draw();
	}

	draw() {
		//Tank image
		ctx.save();
		ctx.translate(this.x, this.y);
		if (this.isDynamicPath) {
			ctx.rotate(this.tankAngle - 1.5708);
		} else ctx.rotate(1.5708 * 2);

		ctx.drawImage(this.tankImage, this.tankImgStartX,
			this.tankImgStartY, this.tankImgWidth, this.tankImgHeight,
			0 - this.tankScaleX / 2, 0 - this.tankScaleY / 2, this.tankScaleX, this.tankScaleY);

		ctx.restore();

		//turret image
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(this.angle);
		ctx.drawImage(this.turretImage, this.turretImgStartX, this.turretImgStartY, this.turretImgWidth, this.turretImgHeight, 0 - 18, 0 - 50, 36, 72);
		ctx.restore();

		//Health
		if (!this.isDead) {
			ctx.beginPath();

			ctx.strokeStyle = "black";
			ctx.rect(this.x - this.width / 2, this.y - this.width, (this.health / (this.maxHealth / 50)), 3)
			ctx.fillStyle = "red";
			ctx.stroke();
			ctx.fill();

		}
	}
}

class Spawn {
	constructor() {
		this.isReady = false;
		this.randomX = 0;
		this.randomY = 0;
		this.randomTier = 0;
		this.randomType = 0;
		this.randomWeaponsType = 0;
		this.isNextWave = false;
		this.hasWaveEnded = true;
		this.displayTimer = 120;
		this.waveNo = 0;
		this.tankCounter = 0;
		this.tanksInWave = 0;
		this.tanksDestroyed = 0;
		this.tick = 0; //for difficulty increasing with time.
		this.isSet = false;

		//tank spawner
		this.spawnPosition = []; //Spawn positions
		this.enemyOrder = []; //List of tank waves
		this.quantity = 0; //How many
		this.spawnFull = false; //checks if spawn points are full
	}

	update() {
		//Initial settings
		if (this.isReady == false) {
			let positions = Math.floor(canvas.width / 100); //Spawn spacing 100, spaces in width
			for (var i = 0; i < positions; i++) {
				this.spawnPosition[i] = false;
			}

			this.isReady = true;
		}

		//Checks if wave has ended
		if (this.isNextWave == false && this.hasWaveEnded) {
			this.waveNo++;
			this.hasWaveEnded = false;
			this.isNextWave = true;
			this.tankCounter = 0;
			this.tankDelay = 300;

			//Winning condition
			if (this.waveNo == 2) {
				state.game = false;
				state.endGame = true;
			}
		}

		//Starts/updates new wave.
		if (this.isNextWave && this.displayTimer == 120 && this.isSet == false) {

			this.tanksInWave = 0;
			switch (this.waveNo) {
				case 1:
					this.tankDelay = 210; //60fps = 1s 
					this.enemyOrder.push([300, "r", "r", "r"]); //[quantity, tier, type, weapons type] r = for random. 
					// this.enemyOrder.push([2,1,1,1]);
					break;
				case 2:
					// this.tankDelay = 100;
					// this.enemyOrder.push([5,1,6,1])
					break;
				case 3:

					break;
				default:

			}

			for (var i = 0; i < this.enemyOrder.length; i++) {
				this.tanksInWave += this.enemyOrder[i][0];
			}
			this.isNextWave = false;
			this.isSet = true;
		}

		//Checks if wave has ended
		//waves
		// if (this.tankCounter == this.tanksInWave && tanks.length == 0 && !this.isNextWave) this.hasWaveEnded = true;

		//continous mode
		if (this.tanksDestroyed == this.tanksInWave && !this.isNextWave) this.hasWaveEnded = true;

		//Spawns new tanks 
		if (!this.hasWaveEnded && framesCounter % this.tankDelay == 0 && this.tankCounter < this.tanksInWave) {
			this.randomSpawn();
			if (this.spawnFull == false) {
				tanks.push(new Tank(this.randomX, this.randomY, this.randomTier, this.randomType, this.randomWeaponsType));
				this.tankCounter++;
			}
			this.spawnFull = false;
		}
		this.tick++;

		if (framesCounter % 800 == 0) {
			this.tankDelay -= 2;
			// console.log(this.tankDelay);
		}
		this.draw();
	}

	draw() {
		//Shows wave number update (disabled for single wave mode.)
		// if (this.isNextWave) {
		// 	ctx.beginPath();
		// 	ctx.font = "70px Arial";
		// 	ctx.fillStyle = "black";
		// 	ctx.fillText("Wave " + this.waveNo, 300, 200);
		// 	ctx.fill();

		// 	this.displayTimer --;
		// 	if (this.displayTimer == 0) {
		// 		this.isNextWave = false;
		// 		this.displayTimer = 120;
		// 	}
		// }


		//Debug spawn positions, shows spawn squares
		// let spawnpos = Math.floor(canvas.width/100);
		// console.log(this.spawnPosition.length);
		// for (let i = 0; i < this.spawnPosition.length; i++) {
		// 	ctx.strokeStyle = "orange";
		// 	ctx.rect(i*100, 50, 100, 100);
		// }

		ctx.stroke();

	}

	//spawns desired amount of tanks based on queue
	randomSpawn() {
		//if enemy list is not empty
		if (this.enemyOrder.length != 0) {
			let randomPosition = Math.floor(Math.random() * this.spawnPosition.length);
			// let randomPosition = 0; //testing

			//resets the spawn position status
			if (tanks.length == 0) {
				for (var i = 0; i < this.spawnPosition.length; i++) {
					this.spawnPosition[i] = false;
				}
			}

			//checks which spawns are free or not.
			for (var i = 0; i < this.spawnPosition.length; i++) {
				for (var t = 0; t < tanks.length; t++) {
					if (overlaps(tanks[t].x - 25, tanks[t].y - 50, tanks[t].width, tanks[t].height, i * 100, 100, 100, 100)) {
						this.spawnPosition[i] = true;
						break;

					} else this.spawnPosition[i] = false;
				}
			}

			//if this random position is occupied, choose next available.
			if (this.spawnPosition[randomPosition] == true) {

				let spawnsLocked = 0;
				this.spawnFull = false;
				//checks if last spawn position has been reached, reset, start checking from pos 0;
				for (var i = 0 + randomPosition; i < 50; i++) {
					if (i >= this.spawnPosition.length) {
						i = 0;
					}
					//if possition is free, set this possition as spawn.
					if (this.spawnPosition[i] == false) {
						randomPosition = i;
						this.spawnPosition[i] = true;
						break;

					} else {
						//Checks if all spawns are closed and updates.
						spawnsLocked++;
						if (spawnsLocked == this.spawnPosition.length) {
							this.spawnFull = true;
							break;
						} else this.spawnFull = false;
						continue;
					}
				}
			}

			//Debug displays closed and open spawn positions.
			// let posit = "";
			// for (let x = 0; x < this.spawnPosition.length; x++) {
			// 		if(this.spawnPosition[x] == true) posit += "1 ";
			// 		else posit += "0 ";
			// }
			// console.log(posit);

			//Sets x for spawn
			this.randomX = (randomPosition) * 100 + 50;
			// this.randomX = 400; //debug

			//Sets y for spawn
			if (this.spawnFull) {
				this.randomY = 0
			} else this.randomY = 0;

			//Sets tank settings for tank
			if (this.enemyOrder[0][1] === "r") {
				let extra = this.tick / 100 / 150 * 4;// tick/100 = 1s / 1200 (20min) * 4 (0 - 4tier),
				// Higher tiers will appear as game progresses.
				if (extra > 4) extra = 4;

				let t1Chance = Math.random() * (extra + 0.01);
				this.randomTier = Math.ceil((t1Chance));
				// console.log(this.randomTier);
				// this.randomTier = Math.floor(extra + (Math.random()*(4 - extra)));

				this.randomType = 1 + Math.floor(Math.random() * 7);
				this.randomWeaponsType = 1 + Math.floor(Math.random() * 7);

			} else {
				this.randomTier = this.enemyOrder[0][1];
				this.randomType = this.enemyOrder[0][2];
				this.randomWeaponsType = this.enemyOrder[0][3];
			}
			this.quantity++;

			//Sets how many to spawn.
			if (this.quantity == this.enemyOrder[0][0]) {
				this.enemyOrder.splice(0, 1);
				this.quantity = 0;
			}

			//debug, random spawn, experimental
			// this.randomTier = Math.ceil(Math.random() * tier);
			// this.randomType = Math.round(Math.random() * 6 + 1);
			// this.randomWeaponsType = Math.round(Math.random() + 1);
		}
	}
}

class Shop {
	constructor(hud) {
		this.hud = hud;

		this.isReady = false;
		this.width;
		this.height;
		this.gridX = [[], [], []]; //grid for shop items
		this.gridY = [[], [], [], []]; //grid for shop items

		this.turretImageX = [[], [], []]; //turret images
		this.turretImageY = [[], [], []]; //turret images

		this.imageWidth = 218;
		this.imageHeight = 286;

		this.turretCost = 3000; //cost for tier 2
		this.turretUnlocked = 1;

		this.machinegunCost = 3000; //cost for tier 1
		this.machinegunUnlocked = 0;

		this.rocketCost = 4500; //cost for tier 1
		this.rocketUnlocked = 0;

		this.weaponTypeSelected = 1; //current selected weapons
		this.weaponTierSelected = 1; //current selected weapons

		//Bonus upgrades
		this.bnsDamTurret = 0;
		this.bnsDamMachinegun = 0;
		this.bnsDamRocket = 0;

		this.bnsSpdTurret = 0;
		this.bnsSpdMachinegun = 0;
		this.bnsSpdRocket = 0;

		this.bnsRelTurret = 0;
		this.bnsRelMachinegun = 0;
		this.bnsRelRocket = 0;

		this.bnsBstTurret = 0;
		this.bnsBstRocket = 0;

		this.bnsDamTurretCost = 20;
		this.bnsDamMachinegunCost = 15;
		this.bnsDamRocketCost = 25;

		this.bnsSpdTurretCost = 30;
		this.bnsSpdMachinegunCost = 15;
		this.bnsSpdRocketCost = 25;

		this.bnsRelTurretCost = 30;
		this.bnsRelMachinegunCost = 20;
		this.bnsRelRocketCost = 35;

		this.bnsBstTurretCost = 25;
		this.bnsBstRocketCost = 25;

	}

	update() {
		//Initial settings
		if (!this.isReady) {
			this.width = (canvas.width - 120) / 2;
			this.height = (canvas.height - 150) / 4;

			//grid position
			for (let x = 0; x < this.gridX.length; x++) {
				for (let y = 0; y < this.gridY.length; y++) {
					this.gridX[x][y] = ((x + 1) * 30) + this.width * (x + 1) - this.width;
					this.gridY[x][y] = ((y + 1) * 30) + this.height * (y + 1) - this.height;
				}
			}
			//grid position for turret images
			for (let x = 0; x < this.turretImageX.length; x++) {
				for (let y = 0; y < this.turretImageY.length; y++) {
					this.turretImageX[x][y] = (x + 1) * this.imageWidth - this.imageWidth;
					this.turretImageY[x][y] = (y + 1) * this.imageHeight - this.imageHeight;
				}

			}

			//resets upgrades
			this.turretCost = 3000; //cost for tier 2
			this.turretUnlocked = 1;

			this.machinegunCost = 3000; //cost for tier 1
			this.machinegunUnlocked = 0;

			this.rocketCost = 4500; //cost for tier 1
			this.rocketUnlocked = 0;

			this.weaponTypeSelected = 1; //current selected weapons
			this.weaponTierSelected = 1;

			this.bnsDamTurret = 0;
			this.bnsDamMachinegun = 0;
			this.bnsDamRocket = 0;

			this.bnsSpdTurret = 0;
			this.bnsSpdMachinegun = 0;
			this.bnsSpdRocket = 0;

			this.bnsRelTurret = 0;
			this.bnsRelMachinegun = 0;
			this.bnsRelRocket = 0;

			this.bnsBstTurret = 0;
			this.bnsBstRocket = 0;

			this.isReady = true;
		}

		//On click on upgrade Turret
		let wX1 = this.gridX[0][1], wY1 = this.gridY[0][1] - 80;
		if (mouse.click) {
			if (this.turretUnlocked != 3 && mouseInRect(wX1 + 130, wY1 + 40, 100, 30)) {
				if (this.turretUnlocked == 1) {
					if (checkCost(this.turretCost)) {
						this.turretUnlocked++;
						this.turretCost = 5000; // Turret 3 cost
					}

				} else if (this.turretUnlocked == 2) {
					if (checkCost(this.turretCost)) {
						this.turretUnlocked++;
					}
				}
				setWeapon(1, this.turretUnlocked);

			} else if (mouseInRect(wX1 + 130, wY1 + 90, 100, 30)) {
				//... on equip click;
				setWeapon(1, this.turretUnlocked);
			}
		}

		//On mouse click weapon 2 Machinegun
		let wX2 = this.gridX[0][2], wY2 = this.gridY[0][2] - 80;
		if (mouse.click) {
			if (this.machinegunUnlocked != 3 && mouseInRect(wX2 + 130, wY2 + 40, 100, 30)) {
				if (this.machinegunUnlocked == 0) {
					if (checkCost(this.machinegunCost)) {
						this.machinegunUnlocked++;
						this.machinegunCost = 2000;
					}

				} else if (this.machinegunUnlocked == 1) {
					if (checkCost(this.machinegunCost)) {
						this.machinegunUnlocked++;
						this.machinegunCost = 4000;
					}

				} else if (this.machinegunUnlocked == 2) {
					if (checkCost(this.machinegunCost)) {
						this.machinegunUnlocked++;
					}
				}
				if (this.machinegunUnlocked != 0) {
					setWeapon(2, this.machinegunUnlocked);
				}
				return;

			} else if (this.machinegunUnlocked > 0 && mouseInRect(wX2 + 130, wY2 + 90, 100, 30)) {
				//... on equip click;
				setWeapon(2, this.machinegunUnlocked);
			}
		}

		//On mouse click weapon 3 Rocket
		let wX3 = this.gridX[0][3], wY3 = this.gridY[0][3] - 80;
		if (mouse.click) {
			if (this.rocketUnlocked != 3 && mouseInRect(wX3 + 130, wY3 + 40, 100, 30)) {
				if (this.rocketUnlocked == 0) {
					if (checkCost(this.rocketCost)) {
						this.rocketUnlocked++;
						this.rocketCost = 5000;
					}

				} else if (this.rocketUnlocked == 1) {
					if (checkCost(this.rocketCost)) {
						this.rocketUnlocked++;
						this.rocketCost = 7000;
					}

				} else if (this.rocketUnlocked == 2) {
					if (checkCost(this.rocketCost)) {
						this.rocketUnlocked++;
					}
				}
				if (this.rocketUnlocked != 0) {
					setWeapon(3, this.rocketUnlocked);
				}

				return;
			} else if (this.rocketUnlocked > 0 && mouseInRect(wX3 + 130, wY3 + 90, 100, 30)) {
				//... on equip click;
				setWeapon(3, this.rocketUnlocked);
			}
		}

		//Bunus upgrades
		let x1 = this.gridX[1][1], y1 = this.gridY[1][1] - 120;
		if (mouse.click) {
			//Turret Bonus
			if (mouseInRect(x1, y1 + 60, 25, 25) && this.bnsDamTurret < 5) {
				if (this.hud.cash >= this.bnsDamTurretCost * this.bnsDamTurret * 4 + this.bnsDamTurretCost) {
					this.hud.cash -= this.bnsDamTurretCost * this.bnsDamTurret * 4 + this.bnsDamTurretCost;
					this.bnsDamTurret += 0.25;
				}

			} else if (mouseInRect(x1, y1 + 60 + 40, 25, 25) && this.bnsSpdTurret < 20) {
				if (this.hud.cash >= this.bnsSpdTurretCost * this.bnsSpdTurret + this.bnsSpdTurretCost) {
					this.hud.cash -= this.bnsSpdTurretCost * this.bnsSpdTurret + this.bnsSpdTurretCost;
					this.bnsSpdTurret += 1;
				}

			} else if (mouseInRect(x1, y1 + 60 + 80, 25, 25) && this.bnsRelTurret < 100) {
				if (this.hud.cash >= this.bnsRelTurretCost * this.bnsRelTurret / 5 + this.bnsRelTurretCost) {
					this.hud.cash -= this.bnsRelTurretCost * this.bnsRelTurret / 5 + this.bnsRelTurretCost;
					this.bnsRelTurret += 5;
				}

			} else if (mouseInRect(x1, y1 + 60 + 120, 25, 25) && this.bnsBstTurret < 100) {
				if (this.hud.cash >= this.bnsBstTurretCost * this.bnsBstTurret / 5 + this.bnsBstTurretCost) {
					this.hud.cash -= this.bnsBstTurretCost * this.bnsBstTurret / 5 + this.bnsBstTurretCost;
					this.bnsBstTurret += 5;
				}
			}

			//Machinegun Bonus
			let x2 = this.gridX[1][2], y2 = this.gridY[1][2] - 120;

			if (mouseInRect(x2, y2 + 60, 25, 25) && this.bnsDamMachinegun < 5) {
				if (this.hud.cash >= this.bnsDamMachinegunCost * this.bnsDamMachinegun * 4 + this.bnsDamMachinegunCost) {
					this.hud.cash -= this.bnsDamMachinegunCost * this.bnsDamMachinegun * 4 + this.bnsDamMachinegunCost;
					this.bnsDamMachinegun += 0.25;
				}

			} else if (mouseInRect(x2, y2 + 60 + 40, 25, 25) && this.bnsSpdMachinegun < 20) {
				if (this.hud.cash >= this.bnsSpdMachinegunCost * this.bnsSpdMachinegun + this.bnsSpdMachinegunCost) {
					this.hud.cash -= this.bnsSpdMachinegunCost * this.bnsSpdMachinegun + this.bnsSpdMachinegunCost;
					this.bnsSpdMachinegun += 1;
				}

			} else if (mouseInRect(x2, y2 + 60 + 80, 25, 25) && this.bnsRelMachinegun < 5) {
				if (this.hud.cash >= this.bnsRelMachinegunCost * this.bnsRelMachinegun * 4 + this.bnsRelMachinegunCost) {
					this.hud.cash -= this.bnsRelMachinegunCost * this.bnsRelMachinegun * 4 + this.bnsRelMachinegunCost;
					this.bnsRelMachinegun += 0.25;
				}

			} else if (mouseInRect(x2, y2 + 60 + 120, 25, 25) && this.bnsDamMachinegun < 20) {
				// if (this.hud.cash >= 50 * this.bnsBstTurret) {
				// 	this.bnsBstTurret += 1;
				// 	this.hud.cash -= 50 * this.bnsBstTurret;
				// }
			}
			//Rocket Bonus
			let x3 = this.gridX[1][3], y3 = this.gridY[1][3] - 120;

			if (mouseInRect(x3, y3 + 60, 25, 25) && this.bnsDamRocket < 20) {
				if (this.hud.cash >= this.bnsDamRocketCost * this.bnsDamRocket + this.bnsDamRocketCost) {
					this.hud.cash -= this.bnsDamRocketCost * this.bnsDamRocket + this.bnsDamRocketCost;
					this.bnsDamRocket += 1;
				}

			} else if (mouseInRect(x3, y3 + 60 + 40, 25, 25) && this.bnsSpdRocket < 20) {
				if (this.hud.cash >= this.bnsSpdRocketCost * this.bnsSpdRocket + this.bnsSpdRocketCost) {
					this.hud.cash -= this.bnsSpdRocketCost * this.bnsSpdRocket + this.bnsSpdRocketCost;
					this.bnsSpdRocket += 1;
				}

			} else if (mouseInRect(x3, y3 + 60 + 80, 25, 25) && this.bnsRelRocket < 20) {
				if (this.hud.cash >= this.bnsRelRocketCost * this.bnsRelRocket + this.bnsRelRocketCost) {
					this.hud.cash -= this.bnsRelRocketCost * this.bnsRelRocket + this.bnsRelRocketCost;
					this.bnsRelRocket += 1;
				}

			} else if (mouseInRect(x3, y3 + 60 + 120, 25, 25) && this.bnsBstRocket < 20) {
				if (this.hud.cash >= this.bnsBstRocketCost * this.bnsBstRocket + this.bnsBstRocketCost) {
					this.hud.cash -= this.bnsBstRocketCost * this.bnsBstRocket + this.bnsBstRocketCost;
					this.bnsBstRocket += 1;
				}
			}

			mouse.click = false;
			player.isWeaponUpdate = true;
		}

		function setWeapon(type, unlocked) {
			player.weaponType = type;
			player.weaponTier = unlocked;
			player.isWeaponUpdate = true;
			player.isReady = false;
			shop.weaponTypeSelected = type;
			shop.weaponTierSelected = unlocked;
			mouse.click = false;
		}

		function checkCost(cost) {
			if (hud.cash >= cost) {
				hud.cash -= cost;
				return true;
			} else return false;
		}

		this.draw();
	}

	draw() {

		ctx.beginPath();
		//Background
		// ctx.strokeStyle = "black";
		// ctx.fillStyle = "rgb(255,255,255)";
		// ctx.rect(0, 0, canvas.width, canvas.height);
		// ctx.fill();

		//Background image
		ctx.drawImage(bgShop, 0, 0,
			bgShop.width, bgShop.height, 0, 0, canvas.width, canvas.height);

		// ctx.fillStyle = "orange";
		// ctx.arc(this.gridX[1][1], this.gridY[1][1], 100, 0, 2 * Math.PI);
		ctx.fill();
		ctx.stroke();

		//Weapons type 1
		ctx.font = "20px Arial";
		ctx.beginPath();
		ctx.fillStyle = "rgb(0,0,0, 0.6)";
		ctx.rect(this.gridX[0][1], this.gridY[0][1] - 90, this.gridX[1][0] * 2 - 60, 190);
		ctx.fill();

		//Shop settings
		let xImage;
		let yImage;

		if (this.turretUnlocked == 1) {
			xImage = this.turretImageX[0][0]
			yImage = this.turretImageY[0][0];
		} else if (this.turretUnlocked == 2) {
			xImage = this.turretImageX[1][0]
			yImage = this.turretImageY[1][0];
		} else {
			xImage = this.turretImageX[2][0]
			yImage = this.turretImageY[2][0];
		}

		//Parent cords for weapon 1 elements
		let wX1 = this.gridX[0][1], wY1 = this.gridY[0][1] - 80;

		ctx.drawImage(playerWeapons, xImage, yImage,
			this.imageWidth, this.imageHeight, wX1, wY1 + 20, 130, 130);

		ctx.beginPath();
		ctx.fillStyle = "white";
		ctx.rect(wX1 + 130, wY1 + 40, 100, 30);
		ctx.stroke();
		if (!(this.turretUnlocked == 3)) {
			ctx.fillStyle = "green";
			ctx.rect(wX1 + 130, wY1 + 40, 100, 30);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.fillText("Upgrade", wX1 + 140, wY1 + 60);
			ctx.fillText("Cost: $" + this.turretCost, wX1 + 240, wY1 + 60);
		} else {
			ctx.fillStyle = "red";
			ctx.rect(wX1 + 130, wY1 + 40, 100, 30);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.fillText("Max", wX1 + 140, wY1 + 60);
		}

		ctx.beginPath();
		ctx.rect(wX1 + 130, wY1 + 90, 100, 30);
		if (this.weaponTypeSelected == 1 && this.weaponTierSelected == this.turretUnlocked) {
			ctx.fillStyle = "green";
			ctx.rect(wX1 + 130, wY1 + 90, 100, 30);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.fillText("Equipped", wX1 + 140, wY1 + 110);
		} else {
			ctx.fillText("Equip", wX1 + 140, wY1 + 110);
		}


		ctx.stroke();

		//Weapons type 2
		ctx.beginPath();
		ctx.fillStyle = "rgb(0,0,0, 0.6)";
		// ctx.rect(this.gridX[1][2], this.gridY[1][2], this.width, this.height);
		ctx.rect(this.gridX[0][2], this.gridY[0][2] - 90, this.gridX[1][0] * 2 - 60, 190);
		ctx.fill();

		if (this.machinegunUnlocked == 0 || this.machinegunUnlocked == 1) {
			xImage = this.turretImageX[0][1]
			yImage = this.turretImageY[0][1];
		} else if (this.machinegunUnlocked == 2) {
			xImage = this.turretImageX[1][1]
			yImage = this.turretImageY[1][1];
		} else {
			xImage = this.turretImageX[2][1]
			yImage = this.turretImageY[2][1];
		}

		//Parent cords for weapon 2 elements
		let wX2 = this.gridX[0][2], wY2 = this.gridY[0][2] - 80;

		ctx.drawImage(playerWeapons, xImage, yImage,
			this.imageWidth, this.imageHeight, wX2, wY2 + 20, 130, 130);


		ctx.beginPath();
		ctx.fillStyle = "white";
		ctx.rect(wX2 + 130, wY2 + 40, 100, 30);
		ctx.stroke();

		ctx.beginPath();
		if (this.machinegunUnlocked == 0) {
			ctx.fillStyle = "orange";
			ctx.rect(wX2 + 130, wY2 + 41, 100, 28);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.fillText("Unlock", wX2 + 140, wY2 + 60);
			ctx.fillText("Cost: $" + this.machinegunCost, wX2 + 240, wY2 + 60);


		} else if (this.machinegunUnlocked < 3) {
			ctx.fillStyle = "green";
			ctx.rect(wX2 + 130, wY2 + 40, 100, 30);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.fillText("Upgrade", wX2 + 140, wY2 + 60);
			ctx.fillText("Cost: $" + this.machinegunCost, wX2 + 240, wY2 + 60);
		} else {
			ctx.fillStyle = "red";
			ctx.rect(wX2 + 130, wY2 + 40, 100, 30);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.fillText("Max", wX2 + 140, wY2 + 60);
		}

		ctx.beginPath();


		if (this.machinegunUnlocked > 0) {
			ctx.fillStyle = "white";
			ctx.rect(wX2 + 130, wY2 + 90, 100, 30);

			if (this.weaponTypeSelected == 2 && this.weaponTierSelected == this.machinegunUnlocked) {

				ctx.fillStyle = "green";
				ctx.rect(wX2 + 130, wY2 + 90, 100, 30);
				ctx.fill();
				ctx.fillStyle = "white";
				ctx.fillText("Equipped", wX2 + 140, wY2 + 110);

			} else {
				ctx.fillText("Equip", wX2 + 140, wY2 + 110);
			}
		}


		ctx.stroke();

		//Weapons type 3
		ctx.beginPath();
		ctx.fillStyle = "rgb(0,0,0, 0.6)";
		// ctx.rect(this.gridX[1][3], this.gridY[1][3], this.width, this.height);
		ctx.rect(this.gridX[0][3], this.gridY[0][3] - 90, this.gridX[1][0] * 2 - 60, 190);
		ctx.fill();



		if (this.rocketUnlocked == 0 || this.rocketUnlocked == 1) {
			xImage = this.turretImageX[0][2]
			yImage = this.turretImageY[0][2];
		} else if (this.rocketUnlocked == 2) {
			xImage = this.turretImageX[1][2]
			yImage = this.turretImageY[1][2];
		} else {
			xImage = this.turretImageX[2][2]
			yImage = this.turretImageY[2][2];
		}

		//Parent cords for weapon 3 elements
		let wX3 = this.gridX[0][3], wY3 = this.gridY[0][3] - 80;

		ctx.drawImage(playerWeapons, xImage, yImage,
			this.imageWidth, this.imageHeight, wX3, wY3 + 20, 130, 130);

		ctx.beginPath();
		ctx.fillStyle = "white";

		ctx.rect(wX3 + 130, wY3 + 40, 100, 30);

		ctx.stroke();

		if (this.rocketUnlocked == 0) {
			ctx.fillStyle = "orange";
			ctx.rect(wX3 + 130, wY3 + 40, 100, 30);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.fillText("Unlock", wX3 + 140, wY3 + 60);
			ctx.fillText("Cost: $" + this.rocketCost, wX3 + 240, wY3 + 60);


		} else if (this.rocketUnlocked < 3) {
			ctx.fillStyle = "green";
			ctx.rect(wX3 + 130, wY3 + 40, 100, 30);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.fillText("Upgrade", wX3 + 140, wY3 + 60);
			ctx.fillText("Cost: $" + this.rocketCost, wX3 + 240, wY3 + 60);
		} else {
			ctx.fillStyle = "red";
			ctx.rect(wX3 + 130, wY3 + 40, 100, 30);
			ctx.fill();
			ctx.fillStyle = "white";
			ctx.fillText("Max", wX3 + 140, wY3 + 60);
		}

		ctx.beginPath();

		if (this.rocketUnlocked > 0) {
			ctx.rect(wX3 + 130, wY3 + 90, 100, 30);
			if (this.weaponTypeSelected == 3 && this.weaponTierSelected == this.rocketUnlocked) {

				ctx.rect(wX3 + 130, wY3 + 90, 100, 30);
				ctx.fillStyle = "green";
				ctx.fill();
				ctx.fillStyle = "white";
				ctx.fillText("Equipped", wX3 + 140, wY3 + 110);


			} else {
				ctx.fillText("Equip", wX3 + 140, wY3 + 110);
				// console.log(this.weaponTypeSelected + " " + this.weaponTierSelected + " " + this.machinegunUnlocked)
			}
		}

		ctx.stroke();

		//end weapon 3
		// ctx.stroke();


		//Weapon type 1 parent cords bonus
		let x1 = this.gridX[1][1], y1 = this.gridY[1][1] - 120;

		ctx.beginPath();
		ctx.strokeStyle = "white";
		ctx.font = "20px Arial";

		for (var i = 0; i < 4; i++) {
			ctx.beginPath();
			if (mouseInRect(x1, y1 + 60 + (40 * i), 25, 25)) ctx.fillStyle = "green";
			else ctx.fillStyle = "grey";

			ctx.rect(x1, y1 + 60 + (40 * i), 25, 25);

			ctx.fill();
			ctx.stroke();
		}

		ctx.strokeStyle = "white";
		// ctx.fillStyle = "blue";
		ctx.beginPath();

		ctx.fillStyle = "white";
		ctx.fillText("+", x1 + 6, y1 + 79);
		ctx.fillText("+", x1 + 6, y1 + 119);
		ctx.fillText("+", x1 + 6, y1 + 159);
		ctx.fillText("+", x1 + 6, y1 + 199);


		ctx.beginPath();
		ctx.fillStyle = "red";

		ctx.rect(x1 + 30, y1 + 65, 300, 15);
		ctx.rect(x1 + 30, y1 + 105, 300, 15);
		ctx.rect(x1 + 30, y1 + 145, 300, 15);
		ctx.rect(x1 + 30, y1 + 185, 300, 15);
		ctx.fill();
		ctx.stroke();

		ctx.beginPath();
		ctx.fillStyle = "green";
		ctx.rect(x1 + 30, y1 + 65, 15 * this.bnsDamTurret * 4, 15)
		ctx.rect(x1 + 30, y1 + 105, 15 * this.bnsSpdTurret, 15);
		ctx.rect(x1 + 30, y1 + 145, 15 * this.bnsRelTurret / 5, 15);
		ctx.rect(x1 + 30, y1 + 185, 15 * this.bnsBstTurret / 5, 15);

		ctx.fill();
		ctx.strokeStyle = "white";

		for (var i = 0; i < 20; i++) {
			ctx.rect(x1 + 30 + 15 * i, y1 + 65, 15, 15);
			ctx.rect(x1 + 30 + 15 * i, y1 + 105, 15, 15);
			ctx.rect(x1 + 30 + 15 * i, y1 + 145, 15, 15);
			ctx.rect(x1 + 30 + 15 * i, y1 + 185, 15, 15);
		}
		ctx.stroke();

		ctx.font = "Bold 15px Arial";

		ctx.fillStyle = "white";
		ctx.fillText("Damage " + this.bnsDamTurret + " + " + 0.25 + " (cost " + (this.bnsDamTurret * 4 * this.bnsDamTurretCost + this.bnsDamTurretCost) + ")", x1 + 30, y1 + 60);
		ctx.fillText("Speed " + this.bnsSpdTurret + " + " + 1 + " (cost " + (this.bnsSpdTurret * this.bnsSpdTurretCost + this.bnsSpdTurretCost) + ")", x1 + 30, y1 + 100);
		ctx.fillText("Reloading " + this.bnsRelTurret + " + " + 5 + " (cost " + (this.bnsRelTurret / 5 * this.bnsRelTurretCost + this.bnsRelTurretCost) + ")", x1 + 30, y1 + 140);
		ctx.fillText("Blast Radius " + this.bnsBstTurret + " + " + 5 + " (cost " + (this.bnsBstTurret / 5 * this.bnsBstTurretCost + this.bnsBstRocketCost) + ")", x1 + 30, y1 + 180);

		//Weapon type 2 parent cords bonus
		if (this.machinegunUnlocked >= 1) {
			let x2 = this.gridX[1][2], y2 = this.gridY[1][2] - 120;
			ctx.beginPath();
			ctx.font = "20px Arial";

			for (var i = 0; i < 4; i++) {
				ctx.beginPath();
				if (mouseInRect(x2, y2 + 60 + (40 * i), 25, 25)) ctx.fillStyle = "green";
				else ctx.fillStyle = "grey";

				ctx.rect(x2, y2 + 60 + (40 * i), 25, 25);

				ctx.fill();
				ctx.stroke();
			}


			ctx.strokeStyle = "white";
			ctx.fillStyle = "blue";
			ctx.beginPath();

			ctx.fillStyle = "white";
			ctx.fillText("+", x2 + 6, y2 + 79);
			ctx.fillText("+", x2 + 6, y2 + 119);
			ctx.fillText("+", x2 + 6, y2 + 159);
			ctx.fillText("+", x2 + 6, y2 + 199);


			ctx.beginPath();
			ctx.fillStyle = "red";

			ctx.rect(x2 + 30, y2 + 65, 300, 15);
			ctx.rect(x2 + 30, y2 + 105, 300, 15);
			ctx.rect(x2 + 30, y2 + 145, 300, 15);
			ctx.rect(x2 + 30, y2 + 185, 300, 15);
			ctx.fill();
			ctx.stroke();

			ctx.beginPath();
			ctx.fillStyle = "green";
			ctx.rect(x2 + 30, y2 + 65, 15 * this.bnsDamMachinegun * 4, 15)
			ctx.rect(x2 + 30, y2 + 105, 15 * this.bnsSpdMachinegun, 15);
			ctx.rect(x2 + 30, y2 + 145, 15 * this.bnsRelMachinegun * 4, 15);
			// ctx.rect(x2 + 30, y2 + 185, 15*this.bnsDamMachinegun, 15);

			ctx.fill();
			ctx.strokeStyle = "white";

			for (var i = 0; i < 20; i++) {
				ctx.rect(x2 + 30 + 15 * i, y2 + 65, 15, 15);
				ctx.rect(x2 + 30 + 15 * i, y2 + 105, 15, 15);
				ctx.rect(x2 + 30 + 15 * i, y2 + 145, 15, 15);
				ctx.rect(x2 + 30 + 15 * i, y2 + 185, 15, 15);
			}
			ctx.stroke();

			ctx.font = "Bold 15px Arial";

			ctx.fillStyle = "white";
			ctx.fillText("Damage " + this.bnsDamMachinegun + " + " + 0.25 + " (cost " + (this.bnsDamMachinegun * 4 * this.bnsDamMachinegunCost + this.bnsDamMachinegunCost) + ")", x2 + 30, y2 + 60);
			ctx.fillText("Speed " + this.bnsSpdMachinegun + " + " + 1 + " (cost " + (this.bnsSpdMachinegun * this.bnsSpdMachinegunCost + this.bnsSpdMachinegunCost) + ")", x2 + 30, y2 + 100);
			ctx.fillText("Reloading " + this.bnsRelMachinegun + " + " + 0.25 + " (cost " + (this.bnsRelMachinegun * 4 * this.bnsRelMachinegunCost + this.bnsRelMachinegunCost) + ")", x2 + 30, y2 + 140);
			// ctx.fillText("Blast Radius (cost " + (this.bnsBstMachinegun * 50 + 50) + ")", x2 + 30, y2 + 180);
		}

		//Weapon type 3 parent cords bonus
		if (this.rocketUnlocked >= 1) {
			let x3 = this.gridX[1][3], y3 = this.gridY[1][3] - 120;

			ctx.beginPath();
			ctx.font = "20px Arial";

			for (var i = 0; i < 4; i++) {
				ctx.beginPath();
				if (mouseInRect(x3, y3 + 60 + (40 * i), 25, 25)) ctx.fillStyle = "green";
				else ctx.fillStyle = "grey";

				ctx.rect(x3, y3 + 60 + (40 * i), 25, 25);

				ctx.fill();
				ctx.stroke();
			}


			ctx.strokeStyle = "white";
			ctx.fillStyle = "blue";
			ctx.beginPath();

			ctx.fillStyle = "white";
			ctx.fillText("+", x3 + 6, y3 + 79);
			ctx.fillText("+", x3 + 6, y3 + 119);
			ctx.fillText("+", x3 + 6, y3 + 159);
			ctx.fillText("+", x3 + 6, y3 + 199);


			ctx.beginPath();
			ctx.fillStyle = "red";

			ctx.rect(x3 + 30, y3 + 65, 300, 15);
			ctx.rect(x3 + 30, y3 + 105, 300, 15);
			ctx.rect(x3 + 30, y3 + 145, 300, 15);
			ctx.rect(x3 + 30, y3 + 185, 300, 15);
			ctx.fill();
			ctx.stroke();

			ctx.beginPath();
			ctx.fillStyle = "green";
			ctx.rect(x3 + 30, y3 + 65, 15 * this.bnsDamRocket, 15)
			ctx.rect(x3 + 30, y3 + 105, 15 * this.bnsSpdRocket, 15);
			ctx.rect(x3 + 30, y3 + 145, 15 * this.bnsRelRocket, 15);
			ctx.rect(x3 + 30, y3 + 185, 15 * this.bnsBstRocket, 15);

			ctx.fill();
			ctx.strokeStyle = "white";

			for (var i = 0; i < 20; i++) {
				ctx.rect(x3 + 30 + 15 * i, y3 + 65, 15, 15);
				ctx.rect(x3 + 30 + 15 * i, y3 + 105, 15, 15);
				ctx.rect(x3 + 30 + 15 * i, y3 + 145, 15, 15);
				ctx.rect(x3 + 30 + 15 * i, y3 + 185, 15, 15);
			}
			ctx.stroke();

			ctx.font = "Bold 15px Arial";

			ctx.fillStyle = "white";
			ctx.fillText("Damage " + this.bnsDamRocket + " + " + 1 + " (cost " + (this.bnsDamRocket * this.bnsDamRocketCost + this.bnsDamRocketCost) + ")", x3 + 30, y3 + 60);
			ctx.fillText("Speed " + this.bnsSpdRocket + " + " + 1 + " (cost " + (this.bnsSpdRocket * this.bnsSpdRocketCost + this.bnsSpdRocketCost) + ")", x3 + 30, y3 + 100);
			ctx.fillText("Reloading " + this.bnsRelRocket + " + " + 1 + " (cost " + (this.bnsRelRocket * this.bnsRelRocketCost + this.bnsRelRocketCost) + ")", x3 + 30, y3 + 140);
			ctx.fillText("Blast Radius " + this.bnsBstRocket + " + " + 1 + " (cost " + (this.bnsBstRocket * this.bnsBstRocketCost + this.bnsBstRocketCost) + ")", x3 + 30, y3 + 180);
		}
	}
}

class Menu {
	constructor() {
		// this.isGameReset = false;
		this.isCreditsShowing = false;
	}

	update() {
		// if (this.isGameReset) {
		// 	fullReset();
		// } else {
		// 	hud.score = 0;
		// }

		this.draw();
	}

	draw() {
		//Background image
		ctx.drawImage(menuImg, 0, 0, menuImg.width, menuImg.height,
			0, 0, canvas.width, canvas.height);

		ctx.beginPath()

		ctx.font = "70px Arial";
		ctx.strokeStyle = "white";
		ctx.fillStyle = "red";

		let playX = canvas.width / 2 - 40;
		let playY = canvas.height / 2 - 50;

		if (!this.isCreditsShowing) {

			//Menu text
			ctx.fillText("Play", playX, playY)
			//On play press
			if (mouseInRect(playX, playY - 60, 140, 80) && mouse.click) {
				state.game = true;
				state.menu = false;
				hud.isReady = false;
			}
			// ctx.rect(playX, playY - 60, 140, 80);

			ctx.fillText("Credits", playX - 40, playY + 150)
			//On credits press
			if (mouseInRect(playX - 40, playY + 90, 220, 80) && mouse.click) {
				this.isCreditsShowing = true;
			}
			// ctx.rect(playX - 40, playY + 90, 220, 80);
		}

		if (this.isCreditsShowing) {
			ctx.fillText("Credits", playX - 40, playY - 100);
			ctx.fillText("Back", playX, playY + 300);

			//on back press
			if (mouseInRect(playX, playY + 250, 160, 70) && mouse.click) {
				this.isCreditsShowing = false;
			}
			// ctx.rect(playX, playY + 250, 160, 70);

			ctx.stroke()
			ctx.beginPath()
			ctx.fillStyle = "white";
			ctx.font = "30px arial";

			ctx.fillText("Weapons art- Nido", playX - 150, playY - 20);
			ctx.fillText("Tanks art - CraftPix.net", playX - 150, playY + 30);
			ctx.fillText("Music - alexandr-zhelanov (soundcloud)", playX - 150, playY + 80);
			ctx.fillText("Made by - nazar1000 (github)", playX - 150, playY + 130);
			ctx.fillText("For details check ../art/attribution.txt", playX - 150, playY + 200);

		}


		ctx.fill();
		ctx.stroke();
	}
}

class EndGame {
	constructor() {
		this.isKeepingUpgrades = true; //whether the game should reset fully or keep weapons upgrades.
	}
	update() {
		this.draw();
	}

	draw() {
		//Background image
		ctx.drawImage(menuImg, 0, 0, menuImg.width, menuImg.height,
			0, 0, canvas.width, canvas.height);


		let lostBtnX = canvas.width / 2 - 110;
		let lostBtnY = canvas.height / 2 - 120;

		ctx.stroke();
		// ctx.fill();

		//On 
		if (mouseInRect(lostBtnX, lostBtnY + 230, 200, 80) && mouse.click) {
			resetGame();
			if (this.isKeepingUpgrades == false) {
				hud.cash = 0;
				shop.isReady = false;
				player.weaponType = 1;
				player.weaponTier = 1;
				player.isReady = false;

			}
			state.endGame = false;
			state.menu = true;
		}

		ctx.beginPath();
		ctx.font = "70px Arial";
		ctx.strokeStyle = "white";
		ctx.fillStyle = "white"

		//Menu text
		if (spawner.waveNo == 2) {
			ctx.fillText("You Won", lostBtnX, lostBtnY)
		} else {
			ctx.fillText("You Lost", lostBtnX, lostBtnY)
		}

		// ctx.fillText("Play", playX, playY)
		ctx.font = "50px Arial";
		ctx.fillText("Score: " + hud.score, canvas.width / 2 - 70, canvas.height / 2 + 40)

		ctx.fillStyle = "green"
		ctx.font = "70px Arial"
		ctx.fillText("Menu", canvas.width / 2 - 80, canvas.height / 2 + 170)

		//Keep weapon upgrades toggle;
		ctx.beginPath();
		ctx.font = "25px Arial"
		ctx.strokeStyle = "white";
		ctx.fillStyle = "white";

		ctx.rect(canvas.width / 2 + 110, canvas.height / 2 + 190, 50, 50)
		ctx.fillText("Keep Upgrades", canvas.width / 2 - 80, canvas.height / 2 + 220)

		if (this.isKeepingUpgrades == true) {
			ctx.fillStyle = "green";
		} else {
			ctx.fillStyle = "red"
		}

		if (mouseInRect(canvas.width / 2 + 110, canvas.height / 2 + 190, 50, 50) && mouse.click) {
			this.isKeepingUpgrades = !this.isKeepingUpgrades;
			mouse.click = false;
		}

		ctx.stroke();
		ctx.fill();
		// menu.isGameReset = !this.isKeepingUpgrades;


		// ctx.fill();
		// ctx.stroke();
	}
}

class HUD {
	constructor() {
		this.cash = 0;
		this.score = 0;
		this.time;
		this.timePassed = 0;
		this.playerMaxHeath = 100;
		this.playerHealth = this.playerMaxHeath;
		this.isReady = false;
	}

	draw() {
		ctx.drawImage(topUI, 0, 0, canvas.width, 80);

		//Hud info
		ctx.beginPath();
		ctx.font = "20px Arial";
		ctx.fillStyle = "Black";
		ctx.fillText("Cash ($):", 30, 25);

		ctx.font = "30px Arial";
		ctx.fillStyle = "white";
		ctx.fillText(this.cash, 30, 55);


		//info Top colums
		ctx.font = "15px Arial";
		ctx.fillStyle = "Black";
		ctx.fillText("Score", canvas.width / 16 * 7 - 15, 20);
		ctx.fillText(this.score, canvas.width / 16 * 7 - 10, 33);

		this.timePassed = Math.floor((new Date().getTime() - this.time) / 1000)
		let minutes = Math.floor(this.timePassed / 60);
		let seconds = this.timePassed - minutes * 60;

		ctx.fillText("Time", canvas.width / 16 * 9 - 15, 20);
		ctx.fillText(minutes + " : " + seconds, canvas.width / 16 * 9 - 15, 33);


		ctx.fillText("Music", canvas.width / 16 * 11 - 15, 20);

		if (mouseInRect(canvas.width / 16 * 11 - 20, 20, 50, 50) && mouse.click) {
			sound.soundMuted = !sound.soundMuted;
			sound.hasSettingsChanged = true;
			mouse.click = false;
		}

		if (sound.soundMuted) {
			sound.masterSound = 0;
			ctx.fillText("OFF", canvas.width / 16 * 11 - 6, 33);

		} else {
			sound.masterSound = sound.defaultSound;
			ctx.fillText("ON", canvas.width / 16 * 11 - 6, 33);
		}

		ctx.stroke();

		ctx.beginPath()
		// ctx.strokeStyle = "white";
		ctx.fillStyle = "white";

		ctx.font = "20px Arial";
		ctx.fillText("Shop", canvas.width / 16 * 13 - 12, 20);
		ctx.fillText("Press 'P'", canvas.width / 16 * 13 - 15, 33);

		// ctx.font = "20px Arial";
		// ctx.fillText("Menu", canvas.width / 16 * 15 - 10, 30);

		// ctx.stroke();
		ctx.fill();
		//info Bottom

		//player health bar Bottom
		ctx.beginPath();
		ctx.strokeStyle = "white";
		ctx.fillStyle = "red";

		//background for health bar
		ctx.rect(canvas.width / 8 * 2, canvas.height - 50, canvas.width / 8 * 4, 50);
		ctx.fill();

		ctx.beginPath();

		//player actual health bar
		ctx.fillStyle = "green";
		ctx.rect(canvas.width / 8 * 2, canvas.height - 50, (this.playerHealth / (this.playerMaxHeath / (canvas.width / 8 * 4))), 50);
		ctx.fill();

		ctx.drawImage(bottomUI, 0, canvas.height - 70, canvas.width, 70);


		ctx.beginPath();
		ctx.font = "20px Arial";
		ctx.fillStyle = "white";
		ctx.fillText("Health: " + this.playerHealth, canvas.width / 8 * 4 - 60, canvas.height - 25);
		ctx.stroke();


		//Toolbar/ buy health
		ctx.font = "22px Arial";
		ctx.fillStyle = "white";
		ctx.fillText("Buy health ($100)", canvas.width / 16 * 13 - 12, canvas.height - 100);
		ctx.fillText("Press 'H'", canvas.width / 16 * 13 - 12, canvas.height - 80);
		// ctx.fill();
		ctx.drawImage(playerWeapons, 0, 0,
			218, 286, 0, canvas.height - 60, 50, 50);

		ctx.drawImage(playerWeapons, 0, 287,
			218, 286, 50, canvas.height - 60, 50, 50);

		ctx.drawImage(playerWeapons, 0, 574,
			218, 286, 100, canvas.height - 60, 50, 50);

		ctx.fillText("1", 40, canvas.height - 35);
		ctx.fillText("2", 90, canvas.height - 35);
		ctx.fillText("3", 140, canvas.height - 35);

		// ctx.stroke();


		// Weapons overheating bar
		if (state.shop == false) {
			let overheatingWidth = 50;
			let overheatingHeight = 5;
			let overheatingX = mouse.x - overheatingWidth / 2 + 6;
			let overheatingY = mouse.y + 20;

			ctx.beginPath();
			// ctx.strokeStyle = "black";
			let color;

			if (player.weaponType == 1) {
				color = player.coolDownT1 * (510 / player.coolDownLimitT1);

			} else {
				color = player.coolDownT2 * (510 / player.coolDownLimitT2);
			}

			let c1, c2;
			if (color <= 255) {
				c1 = color;
				c2 = 255;
			} else if (color > 255) {
				c1 = 255;
				c2 = 255 - (color - 255)
			}

			ctx.fillStyle = "rgb(" + c1 + "," + c2 + "," + 0 + ")";

			if (player.weaponType == 1) {
				ctx.rect(overheatingX + 1, overheatingY + 1, player.coolDownT1 / (player.coolDownLimitT1 / (overheatingWidth)), overheatingHeight);
			} else {
				ctx.rect(overheatingX + 1, overheatingY + 1, player.coolDownT2 / (player.coolDownLimitT2 / (overheatingWidth)), overheatingHeight);

			}

			ctx.fill();
			// ctx.stroke();


			ctx.beginPath();
			ctx.fillStyle = "red";
			ctx.font = "15px Arial";
			if (player.isOverheatedT1 || player.isOverheatedT2) {
				ctx.fillText("Overheating !", overheatingX - 15, overheatingY + 15)
			}
		}

		ctx.fill();
		ctx.stroke();

	}

	update() {
		if (this.isReady == false) {
			this.time = new Date();
			this.isReady = true;
		}

		if (this.playerHealth < 0) {
			this.playerHealth = 0;
			state.endGame = true;
			state.game = false;
			//clear everything and restart game
			// resetGame();
		}
		this.draw()
	}
}


function handler() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

	//Updates/removes "marks" on the grid.
	for (let i = 0; i < marks.length; i++) {
		marks[i].update();
		if (marks[i].isRemove) {
			marks.splice(i, 1);
		}
	}

	//Checking player bullets for collision
	for (let i = 0; i < playerBullets.length; i++) {

		//If bullets are outside the canvas
		if (playerBullets[i].x < 0 || playerBullets[i].x > canvas.width || playerBullets[i].y < 0 || playerBullets[i].y > canvas.height) {
			playerBullets.splice(i, 1);
		}
		//If player bullets exist after being outside canvas.
		if (playerBullets[i]) {
			playerBullets[i].update();

			//Checking if bullets collided with enemies
			for (let t = 0; t < tanks.length; t++) {
				if (rectCircleColliding(playerBullets[i], tanks[t])) {
					if (!tanks[t].hasCollided && !tanks[t].isDead) {
						tanks[t].hasCollided = true;
						tanks[t].health -= playerBullets[i].damage;

						//Marks tank as dead and spawns effects
						if (tanks[t].health <= 0) {
							hud.cash += 200 * tanks[t].tier;
							hud.score += 100 * tanks[t].tier;
							effects.push(new BulletExplosion(tanks[t].x, tanks[t].y, 50, "tank", "enemy",));
							playSound(sound.tankExplosionSound);
							tanks[t].isDead = true;
							spawner.tanksDestroyed++;
						}


						//Checks for nearby tanks and deals damage if in range of blast damage
						checkExplosion(playerBullets[i].x, playerBullets[i].y, playerBullets[i].damage, tanks[t].id);

						//test \/

						// for (let t2 = 0; t2 < tanks.length; t2++) {
						// 	let distance = checkDistance(playerBullets[i].x, playerBullets[i].y, tanks[t2].x, tanks[t2].y);
						// 	console.log(distance);
						// 	if (tanks[t].id != tanks[t2].id && distance <= player.bulletBlast+25) { //+25 will count the distance from the moment of reaching sides of tank
						// 		tanks[t2].health -= (player.bulletBlast-distance-25)*(playerBullets[i].damage/player.bulletBlast);

						// 		if (tanks[t2].health <= 0 && tanks[t2].isDead == false) {
						// 			hud.cash += (150 * tanks[t2].tier)
						// 			effects.push(new BulletExplosion(tanks[t2].x, tanks[t2].y, 50, "tank", "enemy",));
						// 			tanks[t2].isDead = true;
						// 		}
						// 	}

						// }

						// if (this.hasCollided || (player.weaponType == 1 || player.weaponType == 3) && (checkDistance(this.x, this.y, this.tx + this.bulletSpreadX, this.ty + this.bulletSpreadY) < 10)) {
						// 	effects.push(new BulletExplosion (this.x, this.y, this.splash, "bullet", this.team, this.damage));
						// 	remove(this.array, this.id);
						// }

						//test /\

						//Spawns effect for bullet and removes player bullet.
						effects.push(new BulletExplosion(playerBullets[i].x, playerBullets[i].y, player.bulletBlast, "bullet", playerBullets[i].damage));
						remove(playerBullets, playerBullets[i].id);

					}

				} else {
					tanks[t].hasCollided = false;
				}
			}
		}
	}

	//Checking enemies bullets
	for (let i = 0; i < enemiesBullets.length; i++) {

		//If bullets are outside the canvas
		if (enemiesBullets[i].x < 0 || enemiesBullets[i].x > canvas.width || enemiesBullets[i].y < 0 || enemiesBullets[i].y > canvas.height) {
			enemiesBullets.splice(i, 1);
		}
		//If player bullets exist after being outside canvas.
		if (enemiesBullets[i]) {
			//Checks if enemy bullet is within player 
			if (checkDistance(enemiesBullets[i].x, enemiesBullets[i].y, player.x, player.y) < player.width / 2 && !enemiesBullets[i].hasCollided) {
				hud.playerHealth -= enemiesBullets[i].damage;
				enemiesBullets[i].hasCollided = true;
			}

			enemiesBullets[i].update();
		}
	}

	//Loop for enemy tanks
	for (let i = 0; i < tanks.length; i++) {
		tanks[i].update();
		if (tanks[i].isDead) {
			if (tanks[i].deathTimer > 0) {
				tanks[i].deathTimer--;
			} else {
				marks.push(new Mark(tanks[i].x, tanks[i].y));
				tanks.splice(i, 1);
				if (tanks[i]) tanks[i].update();
			}
			continue;
		}

		let dx = player.x - tanks[i].x;
		let dy = player.y - tanks[i].y;
		let distance = Math.sqrt(dx * dx + dy * dy);

		if (distance < 300) {
			tanks[i].speed = 0;
			tanks[i].isInRange = true;

		} else {
			tanks[i].speed = tanks[i].defaulSpeed;
			tanks[i].isInRange = false;
		}

		//If tanks are tailgatting stop*.
		for (let o = 0; o < tanks.length; o++) {
			if (tanks[i] != tanks[o]) {
				if (overlaps(tanks[o].x - tanks[o].height / 2, tanks[o].y - tanks[o].height / 2, tanks[o].height, tanks[o].height,
					tanks[i].collisionX - tanks[i].height / 2, tanks[i].collisionY - tanks[i].height / 2, tanks[i].height, tanks[i].height)) {

					if (checkDistance(tanks[i].x, tanks[i].y, tanks[o].x, tanks[o].y) < 300) {
						if (tanks[i].isInRange == false) {
							tanks[i].speed = 0;

						}
					}
				}
			}
		}
	}

	player.update();
	sound.update();

	//effects loop
	for (let i = 0; i < effects.length; i++) {
		effects[i].update();
	}


	// Helper function 

	//Checks collision between cirlce and rect
	function rectCircleColliding(circle, rect) {
		if (!circle) { return false };
		var distX = Math.abs(circle.x - rect.x);
		var distY = Math.abs(circle.y - rect.y);

		if (distX > (rect.width / 2 + circle.radius)) { return false; }
		if (distY > (rect.height / 2 + circle.radius)) { return false; }

		if (distX <= (rect.width / 2)) { return true; }
		if (distY <= (rect.height / 2)) { return true; }

		var dx = distX - rect.width / 2;
		var dy = distY - rect.height / 2;
		return (dx * dx + dy * dy <= (circle.radius * circle.radius));
	}
}

//Testing
var start;
var frames = 0;
var reset = true;
var calc;

//animation
function animate() {

	//testing purposes
	// frames++;
	// if (reset == true) {
	// 	start = Date.now();
	// 	reset = false;
	// }

	if (state.menu) {
		menu.update();

	} else if (state.game) {
		handler();
		spawner.update();
		hud.update();
		framesCounter++;
		// sound.music.play();

	} else if (state.shop) {
		// ctx.save();
		shop.update();
		hud.update();
		// ctx.restore();
	} else if (state.endGame) {
		endGame.update();
	}

	ctx.drawImage(cursor, 0, 0, cursor.width, cursor.height,
		mouse.x - 25, mouse.y - 25, 50, 50, 50);



	//Testing purposes
	// if ((Date.now() - start)/1000 >= 1) {
	// 	console.log("Frames " + frames);
	// 	frames = 0;
	// 	reset = true;
	// }

	requestAnimationFrame(animate);

}

function init() {
	menu = new Menu();
	sound = new Sound();
	player = new Player(canvas.width / 2, canvas.height - 130, 100, 100);
	hud = new HUD();
	shop = new Shop(hud);
	spawner = new Spawn();
	endGame = new EndGame();

}

function checkExplosion(x, y, damage, id = 0) {
	for (let t2 = 0; t2 < tanks.length; t2++) {
		let distance = checkDistance(x, y, tanks[t2].x, tanks[t2].y);

		if (id != tanks[t2].id && distance <= player.bulletBlast + 25) { //+25 will count the distance from the moment of reaching sides of tank
			let damageTaken = (player.bulletBlast - distance - 25) * (damage / player.bulletBlast);
			if (damageTaken < 0) damageTaken = 0;
			tanks[t2].health -= damageTaken;


			if (tanks[t2].health <= 0 && tanks[t2].isDead == false) {
				hud.cash += 200 * tanks[t2].tier
				hud.score += 100 * tanks[t2].tier;
				effects.push(new BulletExplosion(tanks[t2].x, tanks[t2].y, 50, "tank", "enemy",));
				tanks[t2].isDead = true;
			}
		}

	}
}

function findAngle(x, y, tx, ty) {
	const dx = x - tx;
	const dy = y - ty;
	let theta = Math.atan2(dy, dx);
	return theta;
}

function checkDistance(x, y, tx, ty) {
	let dx = x - tx;
	let dy = y - ty;
	return Math.sqrt(dx * dx + dy * dy);
}

//Mouse only
function mouseInRect(x, y, width, height) {
	if (mouse.x >= x && mouse.x <= (x + width) && mouse.y >= y && mouse.y <= (y + height)) {
		return true;
	}
	return false;
}

function overlaps(x, y, width, height, rectX, rectY, rectWidth, rectHeight) {
	if ((x >= rectX && x <= rectX + rectWidth) || (x + width >= rectX && x + width <= rectX + rectWidth)) {
		if ((y >= rectY && y <= rectY + rectHeight) || (y + height >= rectY && y + height <= rectY + rectHeight)) {
			return true;
		} else return false;
	} else return false;
}

function remove(array, id) {
	for (var i = 0; i < array.length; i++) {
		if (array[i].id == id) {
			array.splice(i, 1);
			break;
		}
	}
}

function resetGame() {
	playerBullets.splice(0, playerBullets.length);
	enemiesBullets.splice(0, enemiesBullets.length);
	effects.splice(0, effects.length);
	marks.splice(0, marks.length);
	tanks.splice(0, tanks.length);
	player.isReady = false;

	hud.score = 0;
	hud.playerHealth = hud.playerMaxHeath;

	spawner.isReady = false;
	spawner.isNextWave = false;
	spawner.hasWaveEnded = true;
	spawner.displayTimer = 120;
	spawner.waveNo = 0;
	spawner.tankCounter = 0;
	spawner.tanksInWave = 0;
	spawner.tanksDestroyed = 0;
	spawner.tick = 0; //for difficulty increasing with time.
	spawner.isSet = false;

	spawner.spawnPosition = []; //Spawn positions
	spawner.enemyOrder = []; //List of tank waves
	spawner.quantity = 0; //How many
	spawner.spawnFull = false; //checks if spawn points are full

}

function playSound(file) {
	if (sound.soundMuted) return;

	var audio = document.createElement('audio');
	audio.src = file.src;
	// var audio = document.createElement("audio");
	// audio = file;
	document.body.appendChild(audio);
	audio.volume = file.volume;
	audio.play();

	audio.onended = function () {
		if (this != null) this.parentNode.removeChild(this);
	}
}


//Resources

//Player

class Sound {
	constructor() {
		this.bgMusic = document.createElement("audio");
		this.soundMuted = false;
		this.defaultSound = 0.04;
		this.masterSound = this.defaultSound;
		this.hasSettingsChanged = true;
		this.audioCleared = false;

		this.music = document.createElement("audio");
		this.music.src = "Music/battle-mus.mp3";
		this.music.loop = true;

		// const shootSound1 = document.createElement("audio");
		// shootSound1.src = "music/fire.mp3";

		this.canonSound = document.createElement("audio");
		this.canonSound.src = "sounds/canonSound.wav";

		// const canonSound2 = document.createElement("audio");
		// canonSound2.src = "sounds/canonSound2.wav";

		// const machinegunSound = document.createElement("audio");
		// machinegunSound.src = "sounds/machinegun.wav";

		this.minigunSound = document.createElement("audio");
		this.minigunSound.src = "sounds/minigun3.wav";

		this.rocketFiringSound = document.createElement("audio");
		this.rocketFiringSound.src = "sounds/rocketFiring.wav";

		this.rocketFlyingSound = document.createElement("audio");
		this.rocketFlyingSound.src = "sounds/rocketFlight2.wav";

		this.tankExplosionSound = document.createElement("audio");
		this.tankExplosionSound.src = "sounds/tankExplosion.wav";

		this.tankShootingSound = document.createElement("audio");
		this.tankShootingSound.src = "sounds/tankShooting.wav";

		this.tankTracksSound = document.createElement("audio");
		this.tankTracksSound.src = "sounds/tankTracks1.wav";

	}

	update() {
		if (this.hasSettingsChanged) {
			this.music.volume = this.masterSound * 0.5;
			this.canonSound.volume = this.masterSound;
			this.minigunSound.volume = this.masterSound * 0.4;
			this.rocketFiringSound.volume = this.masterSound;
			this.rocketFlyingSound.volume = this.masterSound * 0.5;
			this.tankExplosionSound.volume = this.masterSound * 0.3
			this.tankShootingSound.volume = this.masterSound * 0.6
			this.tankTracksSound.volume = this.masterSound * 0.2;
			this.hasSettingsChanged = false;

			if (!this.soundMuted) this.audioCleared = false;

			if (this.soundMuted && this.audioCleared == false) {
				let audioElements = document.getElementsByTagName("audio");

				for (let a = 0; audioElements.length > 0; a++) {
					audioElements[0].parentElement.removeChild(audioElements[0]);
				}

				this.audioCleared = true;
			}

		}

		if (state.game == true && !this.soundMuted) {
			document.body.appendChild(this.music);
			this.music.play();
			this.music.onended = function () {
				this.parentNode.removeChild(this);
			}
		}
	}


}

const tower = new Image();
tower.src = "art/Tower.png";

const cursor = new Image();
cursor.src = "art/target_21.png";

const playerWeapons = new Image();
playerWeapons.src = "art/playerWeapons.png";

//Bullet
const bulletsImg = new Image();
bulletsImg.src = "art/bullets.png";

//Explosion
const explosionMark = new Image();
explosionMark.src = "art/explosionMark.png";

const explosion1 = new Image();
explosion1.src = "art/Explosion.png";

const tankExplosion = new Image();
tankExplosion.src = "art/tankExplosion2.png";

//Hud
const topUI = new Image();
topUI.src = "art/Top UI green.png";
const bottomUI = new Image();
bottomUI.src = "art/Bottom UI green.png";

//Menu
const menuImg = new Image();
menuImg.src = "art/bgMenu.png";

const bg = new Image();
bg.src = "art/bg.png";

//Shop
const bgShop = new Image();
bgShop.src = "art/bgShop.png";

//Tanks
//Tank spreadsheets
// X: 120  Y: 178
//TX: 480 TY: 356 + (84* not userful)
//2 rows 4 each

const tankTier1 = new Image();
tankTier1.src = "art/tanksTier1.png";
const tankTier2 = new Image();
tankTier2.src = "art/tanksTier2.png";
const tankTier3 = new Image();
tankTier3.src = "art/tanksTier3.png";
const tankTier4 = new Image();
tankTier4.src = "art/tanksTier4.png";


//Tank turrets spreadsheets
// X 100 T 200
//TX 400 TY 400
// 2 rows 4 each
const turretTier1 = new Image();
turretTier1.src = "art/turretsTier1.png";
const turretTier2 = new Image();
turretTier2.src = "art/turretsTier2.png";
const turretTier3 = new Image();
turretTier3.src = "art/turretsTier3.png";
const turretTier4 = new Image();
turretTier4.src = "art/turretsTier4.png";

const imageBlueprints = [tankTier1, tankTier2, tankTier3, tankTier4];


window.addEventListener("resize",
	function () {
		canvasPosition = canvas.getBoundingClientRect();
		let size;
		if (window.innerHeight < 800) {
			size = 800;
		} else if (window.innerHeight > 800 && window.innerHeight <= 1200) {
			size = window.innerHeight;
		}

		canvas.width = size;
		canvas.height = size;

		

	});

