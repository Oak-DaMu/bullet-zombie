/**
 * @author Da Mu
 * @version v1.1.0.cn.sy.202508010128
 * @mail 317782199@qq.com
 */
import { Scene3D, ExtendedObject3D, ExtendedMesh, THREE, FLAT } from "@enable3d/phaser-extension";
/**
 * @url -https://github.com/isaac-mason/recast-navigation-js
 * @url -https://github.com/isaac-mason/recast-navigation-js/blob/main/examples/three-vanilla-example/index.html
 * @url -https://recast-navigation-js.isaacmason.com/?path=/story/crowd-crowd-with-multiple-agents--crowd-with-multiple-agents
 * @abstract -Navigation Grid
 */
import {
    init as initRecastNavigation,
    NavMeshQuery,
} from '@recast-navigation/core';
import {
    NavMeshHelper,
    getPositionsAndIndices,
} from '@recast-navigation/three';
import gsap from "gsap";
import { generateSoloNavMesh } from '@recast-navigation/generators';
import proxy from '@/config/host';
import { socket } from '@/utils/Socket';
import { HtmlSubscription } from '@/utils/HtmlSubscription';
import LinkedList from "@/utils/LinkedList";


let ZOMB_COORD = null;

let GO_INTO_ACTION = false;

let ATTACK_LOCK_GHOST_UUID = '';
let ATTACK_LOCK_GHOST_POS = {};

/** Ghost decision-making */
let GPBD_KEY = '';
let GPBD_POLLER = null;

/** Player Constant speed */
const PROGRESS = 0;
const CONSTANT_VELOCITY = 1;

/** Pumpkin weapon Constant speed */
const PROGRESS_PUMPKIN = 0;
const CONSTANT_VELOCITY_PUMPKIN = 4;

/** Ghost Constant speed */
const PROGRESS_GHOST = 0;
let CONSTANT_VELOCITY_GHOST = 1;

/** Players Image speed */
const PROGRESS_PLAYERS_IMAGE = 0;
let CONSTANT_VELOCITY_PLAYERS_IMAGE = 1;

/** Ghost ATK Player Timer */
let GHOST_ATK_PLAYER_TIMER = null;
let GHOST_ATK_TIMER = 1500;

/** Player Die Ray LOCK */
let GROUND_RAY_LOCK = true;
let NPC_RAY_LOCK = true;
let BRAIN_RAY_LOCK = true;
let BRAINS_RAY_LOCK = true;

/**
 * 
 * @param {*} curve 
 * @param {*} segments 
 * @returns distance
 */
function calculatePathLength(curve, segments = 1000) {
    let length = 0;
    let prevPoint = curve.getPoint(0);
    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const point = curve.getPoint(t);
        length += prevPoint.distanceTo(point);
        prevPoint = point;
    }
    return length;
};

/**
 * 
 * @param {*} spline 
 * @param {*} targetDistance 
 * @param {*} segments 
 * @returns distance acquisition point
 */
function getPointAtDistance(spline, targetDistance, segments = 1000) {
    let accumulatedDistance = 0;
    let prevPoint = spline.getPoint(0);

    for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const point = spline.getPoint(t);
        const segmentLength = prevPoint.distanceTo(point);

        if (accumulatedDistance + segmentLength >= targetDistance) {
            const tSegment = (targetDistance - accumulatedDistance) / segmentLength;
            return prevPoint.clone().lerp(point, tSegment);
        }

        accumulatedDistance += segmentLength;
        prevPoint = point;
    }

    return spline.getPoint(1);
};

/**
 * 
 * @param {*} modules 
 * @param {*} interval 
 * @param {*} callback 
 * @returns tmer.stop
 */
function GhostPollingBehaviorDecision(modules, interval, callback) {
    if (!Array.isArray(modules) || modules.length === 0) {
        throw new Error('Invalid modules provided');
    };

    let index = 0;
    let isRunning = false;
    let timer = null;

    executeCallback();

    function executeCallback() {
        if (isRunning) return;

        isRunning = true;
        try {
            callback(modules[index], index);
            index = (index + 1) % modules.length;
        } finally {
            isRunning = false;
        };
    };

    timer = setInterval(executeCallback, interval);

    return {
        stop: function () {
            if (timer) {
                clearInterval(timer);
                timer = null;
            };
        }
    };
};

class SocketRoomData {
    constructor() {
        socket.on('connect', () => {
            // log.debug('WS Connected to server');
        });
        socket.on('disconnect', () => {
            window.location.reload();

            // log.debug('WS Player disconnected');
        });

        /**@description Events  */
        socket.on('AdvertiseMessage', obj => {
            HtmlSubscription.publish("chat", obj);
        });
        /**@abstract Events */
        socket.on('AdvertiseCombatSysMessage', obj => {
            HtmlSubscription.publish("chat", obj);
        });
        /**@abstract Events */
        socket.on('AdvertisePickUpBrainMessage', obj => {
            HtmlSubscription.publish("chat", obj);
        });
        /**@abstract Events */
        socket.on('AdvertiseBulletRPMessage', obj => {
            HtmlSubscription.publish("chat", obj);
        });
        /**@abstract Events */
        socket.on('SceneGameZombieChat', obj => {
            HtmlSubscription.publish('chat', obj);
        });
        /**@abstract Events */
        socket.on('SceneGameMinerChat', obj => {
            HtmlSubscription.publish('chat', obj);
        });
    };

    getAdvertiseMessage() {
        socket.emit('AdvertiseMessage', 'NOT');
    };

    getAdvertiseSceneGameMessage(sw) {
        switch (sw) {
            case '1':
                socket.emit('AdvertiseCombatSysMessage', sw);
                break;
            case '2':
                socket.emit('AdvertiseCombatSysMessage', sw);
                break;
        };
    };

    getZombieCoordinates() {
        socket.emit('privateSceneGameMonsters', 'BM');
    };

    openZombieCoordinatesScheduledTasks() {
        socket.emit('privateSceneGameMonsters', 'LS');
    };

    getSceneGamePlayerInit(opt) {
        return new Promise((resolve, reject) => {
            if (opt === 'new') {
                socket.emit('SceneGamePlayerInit', 'NEW');
                /**@abstract Events */
                socket.on('SceneGamePlayerInit', obj => {
                    if (obj.playerDataTypeInit === 'OK') {
                        HtmlSubscription.publish("player_init");
                        HtmlSubscription.subscribe('player_initt_done', body => {
                            resolve(body.data);
                        });
                    };
                });
            };

            if (opt === 'read') {
                HtmlSubscription.publish("player_init");
                HtmlSubscription.subscribe('player_initt_done', body => {
                    resolve(body.data);
                });
            };
        });
    };

    on() {
        return new Promise((resolve, reject) => {
            socket.connect();
            resolve();
        });
    };

    off() {
        return new Promise((resolve, reject) => {
            socket.disconnect();
            resolve();
        });
    };
};

/** --------------------- Multiplayer online ------------------------------------------------ */

class SocketMultiplayerOnlineRoomData {
    constructor() {

        /**@description Events  */
        socket.on('MORoomOnlinePlayerCount', number => {
            HtmlSubscription.publish('joinMORoom', number);
        });

    };

    players() {
        /**@description Events */
        socket.on('MORoomOnlinePlayersImageMoveData', obj => {
            this.playersAllImage.map(players => {
                /**@abstract other players image move */
                if (players.uuid === obj.body.author) {
                    if (players.playersMove) {
                        players.playersMove = null;
                        players.progress_playersImage = PROGRESS_PLAYERS_IMAGE;
                        players.velocity_playersImage = CONSTANT_VELOCITY_PLAYERS_IMAGE;
                    };

                    players.playersMove = new CreateNavigationPath(this, this.GroundNavMesh, obj.body.players, obj.body.ground);
                    players.isMove = true;
                    players.nameISMove = true;

                    this.openPlayersImage = true;

                    CreateBiologyActAnima.playersImageMove.call(this, players.PlayersImageAnimaMap);
                };
            });
        });

        /**@description Events */
        socket.on('MORoomOnlinePlayersImageInitData', obj => {
            obj.playersId.map(item => {
                item = JSON.parse(item);

                let arr = [];
                const { x, y, z } = obj.body.players;
                const playersImage = this.PlayerPhysics.clone();
                playersImage.anims.mixer = new THREE.AnimationMixer(playersImage);

                /**@description players body. */
                playersImage.uuid = item.author;
                playersImage.isMove = false;
                playersImage.nameISMove = false;
                playersImage.progress_playersImage = PROGRESS_PLAYERS_IMAGE;
                playersImage.velocity_playersImage = CONSTANT_VELOCITY_PLAYERS_IMAGE;

                /**@description players text name. */
                const texture = new FLAT.TextTexture(item.playerName);
                playersImage.playerNameTextSprite = new FLAT.TextSprite(texture);
                this.third.scene.add(playersImage.playerNameTextSprite);
                playersImage.playerNameTextSprite.position.set(x, .5, z);
                playersImage.playerNameTextSprite.setScale(0.005);

                playersImage.position.set(x, y, z);
                this.third.scene.add(playersImage);

                playersImage.animations = this.PlayerOrig.animations;
                this.third.animationMixers.add(playersImage.anims.mixer);
                playersImage.animations.forEach(clip => {
                    arr.push(playersImage.anims.mixer.clipAction(clip));
                });
                playersImage.PlayersImageAnimaMap = arr;
                playersImage.PlayersImageAnimaMap[1].reset().play();

                this.playersAllImage.push(playersImage);
            });
        });

        /**@description Events */
        socket.on('MORoomOnlineLeaveOtherPlayersImageData', id => {
            this.playersAllImage = this.playersAllImage.filter(players => {
                if (players.uuid === id) {
                    players.isMove = false;
                    players.nameISMove = false;
                    this.cleanupObject3DItem(players);
                    this.third.scene.remove(players.playerNameTextSprite);
                };

                return players.uuid !== id;
            });
        });
    };

    delAllPlayersImage() {
        this.openPlayersImage = false;
        this.playersAllImage.map(players => {
            players.isMove = false;
            players.nameISMove = false;
            this.cleanupObject3DItem(players);
            this.third.scene.remove(players.playerNameTextSprite);
        });

        this.playersAllImage = [];
    };
};

/** ------------------------------ END ------------------------------------------------ */

class Http {
    constructor() {
        this.http = `${proxy.development.API}`;
        this.path_img = `${proxy.development.PATH_IMG}`;
        this.path_models = `${proxy.development.PATH_MODELS}`;
    };
};

class HDR {
    init() {
        const renderer = this.third.renderer;
        renderer.antialias = true;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
    };
};

class DebugModelsMaterial {
    static init() {
        return new THREE.MeshPhongMaterial({
            color: 'blue',
            opacity: .5,
            transparent: true
        });
    };
};

class CreateCurve {
    constructor(that, curve, debug) {
        this.spline = null;
        this.debug = debug;
        this.curve = curve;

        this.curvedraw(that);
    };

    curvedraw(that) {
        /** 
         * @description You need to find a modeler or use a binder to 
         * draw the vertex coordinates required for a traffic map, and use 
         * these vertex coordinates to create a path!
         */
        this.spline = new THREE.CatmullRomCurve3(
            this.curve,
            false
        );
        this.spline.curveType = 'catmullrom';
        this.spline.closed = false;
        this.spline.tension = 0.2;

        const points = this.spline.getPoints(this.curve.length * 20); /** subsection: The more curves there are, the smoother they become */
        const line = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(points),
            new THREE.LineBasicMaterial({ color: 0xff0000 })
        );
        line.position.y += 0.1;
        this.debug ? that.third.scene.add(line) : null;
    };
};

class CreateRayModel {
    constructor(that, bol) {
        this.raycaster = new THREE.Raycaster();
        this.groundObjects = [];
        this.npcObjects = [];
        this.brainObjects = [];
        this.chestEquObjects = [];

        that.OpenRayDebug = bol;
        if (bol) {
            that.raycaster = this.raycaster;
            that.arrowHelper = new THREE.ArrowHelper(
                this.raycaster.ray.direction,
                this.raycaster.ray.origin,
                50,
                0xff0000,
                0.2,
                0.1
            );
            that.third.scene.add(that.arrowHelper);
        };

        this.raycaster.params.Points.threshold = 0.5;
        this.raycaster.params.Line.threshold = 0.5;
    };

    updateGroundObjects(objects) {
        this.groundObjects = objects;
    };

    updateNpcObjects(objects) {
        this.npcObjects = objects;
    };

    updateBrainObjects(objects) {
        this.brainObjects = objects;
    };

    updateChestEquObjects(objects) {
        this.chestEquObjects = objects;
    };

    updateNpcObjectsItem(uuid) {
        const update = this.npcObjects.map(mesh => {
            if (mesh.uuid !== uuid) {
                return mesh;
            };
        }).filter(item => item !== undefined);
        this.npcObjects = update;
    };

    unRay() {
        this.raycaster = null;
        this.groundObjects = [];
        this.npcObjects = [];
        this.brainObjects = [];
        this.chestEquObjects = [];

        GROUND_RAY_LOCK = false;
        NPC_RAY_LOCK = false;
        BRAIN_RAY_LOCK = false;
        BRAINS_RAY_LOCK = false;
    }

    ground(that, ground, callback) {
        this.updateGroundObjects(ground);
        that.input.on('pointerdown', () => {
            if (!GROUND_RAY_LOCK) return;
            const { x, y } = that.getPointer();
            this.raycaster.setFromCamera({ x, y }, that.third.camera);
            const intersection_ground = this.raycaster.intersectObjects(this.groundObjects);
            if (intersection_ground.length > 0) {
                const block = intersection_ground[0].object;
                const point = intersection_ground[0].point;
                callback(block.name, point);
            };
        });
    };

    npcs(that, meshNpcs, callback) {
        this.updateNpcObjects(meshNpcs);
        that.input.on('pointerdown', () => {
            if (!NPC_RAY_LOCK) return;
            const { x, y } = that.getPointer();
            this.raycaster.setFromCamera({ x, y }, that.third.camera);
            const intersection_npc = this.raycaster.intersectObjects(this.npcObjects);
            if (intersection_npc.length > 0) {
                const block = intersection_npc[0].object;
                const point = intersection_npc[0].point;
                callback(block.name, point, block);
            };
        });
    };

    brain(that, meshBrains, callback) {
        this.updateBrainObjects(meshBrains);
        that.input.on('pointerdown', () => {
            if (!BRAIN_RAY_LOCK) return;
            const { x, y } = that.getPointer();
            this.raycaster.setFromCamera({ x, y }, that.third.camera);
            const intersection_brain = this.raycaster.intersectObjects(this.brainObjects);
            if (intersection_brain.length > 0) {
                const block = intersection_brain[0].object;
                const point = intersection_brain[0].point;
                callback(block.name, point, block);
            };
        });
    };

    chestEqu(that, meshChestEqu, callback) {
        this.updateChestEquObjects(meshChestEqu);
        that.input.on('pointerdown', () => {
            if (!BRAIN_RAY_LOCK) return;
            const { x, y } = that.getPointer();
            this.raycaster.setFromCamera({ x, y }, that.third.camera);
            const intersection_brain = this.raycaster.intersectObjects(this.chestEquObjects);
            if (intersection_brain.length > 0) {
                const block = intersection_brain[0].object;
                const point = intersection_brain[0].point;
                callback(block.name, point, block);
            };
        });
    };

    brains(that, callback) {
        that.PhysicsBrains.traverse(child => {
            if (child.isMesh) {
                if (child.name === 'torso') {
                    that.input.on('pointerdown', () => {
                        if (!BRAINS_RAY_LOCK) return;
                        const { x, y } = that.getPointer();
                        this.raycaster.setFromCamera({ x, y }, that.third.camera);
                        const intersection_brains = this.raycaster.intersectObjects([child]);
                        if (intersection_brains.length > 0) {
                            const block = intersection_brains[0].object;
                            const point = intersection_brains[0].point;
                            callback(block.name, point, block);
                        };
                    });
                };
            };
        });
    };

    chest(that, callback) {
        that.PhysicsChest.traverse(child => {
            if (child.isMesh) {
                if (child.name === 'chest_1') {
                    that.input.on('pointerdown', () => {
                        if (!that.openTHGameChest) return;
                        const { x, y } = that.getPointer();
                        this.raycaster.setFromCamera({ x, y }, that.third.camera);
                        const intersection_brains = this.raycaster.intersectObjects([child]);
                        if (intersection_brains.length > 0) {
                            const block = intersection_brains[0].object;
                            const point = intersection_brains[0].point;
                            callback(block.name, point, block);
                        };
                    });
                };
            };
        })
    };

    treasureHunt(that, callback) {
        that.PhysicsDigger.traverse(child => {
            if (child.isMesh) {
                if (child.name === 'torso') {
                    that.input.on('pointerdown', () => {
                        if (!BRAINS_RAY_LOCK) return;
                        const { x, y } = that.getPointer();
                        this.raycaster.setFromCamera({ x, y }, that.third.camera);
                        const intersection_brains = this.raycaster.intersectObjects([child]);
                        if (intersection_brains.length > 0) {
                            const block = intersection_brains[0].object;
                            const point = intersection_brains[0].point;
                            callback(block.name, point, block);
                        };
                    });
                };
            };
        });
    };
};

class CreateStraightPath {
    constructor() { };

    computePath(start, end, segments = 20) {
        const points = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const point = new THREE.Vector3().lerpVectors(start, end, t);
            points.push(point);
        }
        return { path: points };
    };
};

class CreateWavePath {
    constructor() { };

    computePath(start, end, options = {}) {
        const {
            segments = 50,
            amplitude = 2,
            frequency = 0.5,
            waveDirection = 'y' // 'x', 'y' or 'z'
        } = options;

        const path = [];
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();

        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const distance = t * length;
            const waveOffset = Math.sin(t * Math.PI * frequency) * amplitude;

            const point = start.clone().add(
                direction.clone().multiplyScalar(distance)
            );

            // 根据方向添加波浪偏移
            if (waveDirection === 'x') point.x += waveOffset;
            else if (waveDirection === 'y') point.y += waveOffset;
            else point.z += waveOffset;

            path.push(point);
        }

        return { path: path };
    };
};

class CreateNavigation {
    constructor(that, models, debug, callback) {

        const [positions, indices] = getPositionsAndIndices(models);

        const cs = 0.05;
        const ch = 0.05;
        const walkableRadius = 0.2;
        const { success, navMesh } = generateSoloNavMesh(positions, indices, {
            cs,
            ch,
            walkableRadius: Math.round(walkableRadius / ch),
            areas: new Uint8Array([1, 1, 1, 1, 1, 1]), // 1=action, 0=obstacle
        });

        if (success && debug) {
            const navMeshHelper = new NavMeshHelper(navMesh);
            that.third.scene.add(navMeshHelper);
        };

        callback(navMesh);
    };
};

class CreateNavigationPath extends CreateCurve {
    constructor(that, navMesh, startPos, endPos, pathType = 'A*') {

        const straightQuery = new CreateStraightPath();
        const waveQuery = new CreateWavePath();
        const navMeshQuery = new NavMeshQuery(navMesh);
        let type = null;

        if (pathType === 'A*') {
            /** A* path */
            const { path } = navMeshQuery.computePath(startPos, endPos);
            type = path;
        };
        if (pathType === 'straight') {
            /** straight path */
            const { path } = straightQuery.computePath(startPos, endPos);
            type = path;
        };
        if (pathType === 'wave') {
            /** wave path */
            const { path } = waveQuery.computePath(startPos, endPos, { amplitude: .12, frequency: 4 });
            type = path;
        };

        super(that, type, false);
        this.path = type;
        this.pathlen = calculatePathLength(this.spline);
        this.clock = new THREE.Clock();
    };

    init(that, model, key, index) {
        const status = [
            { PROGRESS: PROGRESS, CONSTANT_VELOCITY: CONSTANT_VELOCITY },
            { PROGRESS: PROGRESS_PUMPKIN, CONSTANT_VELOCITY: CONSTANT_VELOCITY_PUMPKIN },
            { PROGRESS: PROGRESS_GHOST, CONSTANT_VELOCITY: CONSTANT_VELOCITY_GHOST },
        ];

        if (that[key.progress] >= this.pathlen - .1) {
            that[key.whoWatchOpen].value = false;
            that[key.whoMove] = null;
            that[key.progress] = status[index].PROGRESS;
            that[key.velocity] = status[index].CONSTANT_VELOCITY;
            return;
        };

        that[key.progress] += this.clock.getDelta() * that[key.velocity];
        that[key.progress] = that[key.progress] % this.pathlen;
        const point = getPointAtDistance(this.spline, that[key.progress]);
        model.position.copy(point);

        const nextPoint = getPointAtDistance(this.spline, that[key.progress] + .1);

        let offsetAngle = -3.2;
        let mtx = new THREE.Matrix4();
        mtx.lookAt(model.position, nextPoint, model.up);
        mtx.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, offsetAngle, 0)));
        let toRot = new THREE.Quaternion().setFromRotationMatrix(mtx);
        model.quaternion.slerp(toRot, 0.2);

    };

    imageInit(that, model) {
        if (model.progress_playersImage >= this.pathlen - .5) {
            model.isMove = false;
            model.playersMove = null;
            model.progress_playersImage = PROGRESS_PLAYERS_IMAGE;
            model.velocity_playersImage = CONSTANT_VELOCITY_PLAYERS_IMAGE;

            CreateBiologyActAnima.playersImageStop.call(that, model.PlayersImageAnimaMap);
            return;
        };

        model.progress_playersImage += this.clock.getDelta() * model.velocity_playersImage;
        model.progress_playersImage = model.progress_playersImage % this.pathlen;
        const point = getPointAtDistance(this.spline, model.progress_playersImage);
        model.position.copy(point);

        const nextPoint = getPointAtDistance(this.spline, model.progress_playersImage + .1);

        let offsetAngle = -3.2;
        let mtx = new THREE.Matrix4();
        mtx.lookAt(model.position, nextPoint, model.up);
        mtx.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(0, offsetAngle, 0)));
        let toRot = new THREE.Quaternion().setFromRotationMatrix(mtx);
        model.quaternion.slerp(toRot, 0.2);
    };

};

/**
 * @class CreateInterstellarCoordinates
 * @description Test cursor 
 */
class CreateInterstellarCoordinates {
    lightPyramidArr = [];
    constructor(that, pos, height, width, callback) {
        const coneGeometry = new THREE.ConeGeometry(width, height, 4);
        const material_line = new THREE.MeshBasicMaterial({
            color: 0x00ffff
        });
        const material_geo = new THREE.MeshPhongMaterial({
            color: 0x004444,
            transparent: true,
            opacity: 0.5
        });

        const bottomCone = new THREE.Mesh(coneGeometry, material_geo);

        const wireframe = new THREE.EdgesGeometry(bottomCone.geometry);
        const wireframeMesh = new THREE.LineSegments(wireframe, material_line);
        bottomCone.add(wireframeMesh);

        bottomCone.position.copy(pos);
        bottomCone.rotateX(-Math.PI / 2);
        bottomCone.position.z += height / 2;

        const topCone = new THREE.Mesh(coneGeometry, material_geo);

        const wireframe_top = new THREE.EdgesGeometry(topCone.geometry);
        const wireframeMesh_top = new THREE.LineSegments(wireframe_top, material_line);
        topCone.add(wireframeMesh_top);

        topCone.scale.y = 0.5;
        topCone.position.copy(pos);
        topCone.rotateX(Math.PI / 2);
        topCone.position.z += height + height * 0.25;

        const plane = new THREE.PlaneGeometry(height / 2, height / 2);
        const markerMaterial = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            color: 0x00ffff,
            transparent: true,
            depthTest: false
        })

        const ring = new THREE.Mesh(plane, markerMaterial);

        const wireframe_ring = new THREE.EdgesGeometry(ring.geometry);
        const wireframeMesh_ring = new THREE.LineSegments(wireframe_ring, material_line);
        ring.add(wireframeMesh_ring);

        ring.position.copy(pos);
        ring.position.z += height;
        const lightPyramidGroup = new THREE.Group();
        lightPyramidGroup.rotateX(-Math.PI / 2);
        lightPyramidGroup.add(bottomCone, topCone, ring);
        /** model image */
        that.lightPyramidGroupImage = lightPyramidGroup;

        that.third.scene.add(lightPyramidGroup);
        this.lightPyramidArr.push(lightPyramidGroup);
        callback(true);
    };

    anima() {
        this.lightPyramidArr.map(group => {
            group.children[0].rotation.y += 0.01;
            group.children[1].rotation.y -= 0.01;
            let scale = group.children[2].scale.x;
            let range = 3;
            scale += 0.02;
            let opacity;
            if (scale < range * 0.3) {
                opacity = (scale - 1) / (range * 0.3 - 1);
            }
            else if (scale > range * 0.3 && scale <= range) {
                opacity = 0.3 - (scale - range * 0.3) / (range - range * 0.3);
            }
            else {
                scale = 1.0;
            }
            group.children[2].scale.set(scale, scale, scale);
            group.children[2].material.opacity = opacity;
        });
    };
};

/**
 * @class CreatePlayerMoveCursor
 * @description player move cursor
 */
class CreatePlayerMoveCursor {
    async init() {
        const PlayerMoveCursor = await this.third.load.gltf(this.http + this.path_models + 'indicator-round-c.glb');
        this.PlayerMoveCursor = new ExtendedObject3D().add(PlayerMoveCursor.scene);
        this.PlayerMoveCursor.position.set(0, 30, 0);
        this.PlayerMoveCursor.traverse(child => {
            if (child.isMesh) {
                child.material = new THREE.MeshPhysicalMaterial({ color: 0xfffff, transparent: true, opacity: 1 });
            };
        });
        this.third.scene.add(this.PlayerMoveCursor);
        this.third.animationMixers.add(this.PlayerMoveCursor.anims.mixer);

        PlayerMoveCursor.animations.forEach(clip => {
            const anima = this.PlayerMoveCursor.anims.mixer.clipAction(clip);
            anima.reset().play();
        });
    };
};

class CreateCameraDamping {
    static init(obj) {
        this[obj.name] = obj.orb;
        obj.orb.enableZoom = false;
        obj.orb.enablePan = false;
        obj.orb.enableDamping = true;
        obj.orb.dampingFactor = 0.06;
        obj.orb.maxPolarAngle = Math.PI / 3.2;
        obj.orb.minPolarAngle = Math.PI / 3.2;
    };
};

class CreateSkyBox extends Http {
    constructor() {
        super();
        this.loader = new THREE.CubeTextureLoader();
        this.loader.setPath(this.http + this.path_img);
    };

    DayAndNight(that, boxs) {
        this.loader.load(boxs, function (texture) {
            that.third.scene.background = texture;
        });
    };
};

class SeaWater extends Http {
    constructor(that, arr) {
        super();
        this.init(that, arr);
    };

    async init(that, arr) {
        const textures = await Promise.all([
            that.third.load.texture(this.http + this.path_img + arr[0]),
            that.third.load.texture(this.http + this.path_img + arr[1])
        ]);
        textures[0].needsUpdate = true;
        textures[1].needsUpdate = true;
        that.third.misc.water({
            width: 7.2,
            height: 5,
            x: -1.5,
            y: -1.2,
            z: 7.8,
            normalMap0: textures[0],
            normalMap1: textures[1]
        });
    };
};

class CreatePhysicsGameWorldBiology extends Http {
    // FishBones
    constructor(that, third) {
        super();
        this.physicsScene = new ExtendedObject3D();
        this.physicsPlayer = new ExtendedObject3D();
        this.physicsBrains = new ExtendedObject3D();
        this.physicsDigger = new ExtendedObject3D();
        this.physicsChest = new ExtendedObject3D();
        this.physicsBrain = new ExtendedObject3D();
        this.physicsPumpkin = new ExtendedObject3D();
        this.physicsFloor = new ExtendedMesh();
        this.THPhysics = new ExtendedObject3D();

        this.that = that;
        this.third = third;

        this.Ghost = null;
        this.Brain = null;

        /**@description Treasure equipment */
        this.Coin = null;
        this.Fish = null;
        this.Trophy = null;
        this.Potion = null;
        this.Gun = null;
        this.Clip = null;
        this.Lantern = null;
    };

    async initGhostModel() {
        return new Promise(async (resolve, reject) => {
            try {
                this.Ghost = await this.third.load.gltf(this.http + this.path_models + 'character-ghost.glb');
                resolve();
            } catch (error) {
                reject(error);
            };
        })
    };

    async initBrainModel() {
        return new Promise(async (resolve, reject) => {
            try {
                this.Brain = await this.third.load.gltf(this.http + this.path_models + 'brain.glb');
                resolve();
            } catch (error) {
                reject(error);
            };
        });
    };

    /**@description Treasure equipment */
    async initCoinModel() {
        return new Promise(async (resolve, reject) => {
            try {
                this.Coin = await this.third.load.gltf(this.http + this.path_models + 'coin.glb');
                resolve();
            } catch (error) {
                reject(error);
            };
        });
    };

    async initFishModel() {
        return new Promise(async (resolve, reject) => {
            try {
                this.Fish = await this.third.load.gltf(this.http + this.path_models + 'fish-bones.glb');
                resolve();
            } catch (error) {
                reject(error);
            };
        });
    };

    async initTrophyModel() {
        return new Promise(async (resolve, reject) => {
            try {
                this.Trophy = await this.third.load.gltf(this.http + this.path_models + 'Trophy.glb');
                resolve();
            } catch (error) {
                reject(error);
            };
        });
    };

    async initPotionModel() {
        return new Promise(async (resolve, reject) => {
            try {
                this.Potion = await this.third.load.gltf(this.http + this.path_models + 'wine-white.glb');
                resolve();
            } catch (error) {
                reject(error);
            };
        });
    };

    async initClipModel() {
        return new Promise(async (resolve, reject) => {
            try {
                this.Clip = await this.third.load.gltf(this.http + this.path_models + 'clip-large.glb');
                resolve();
            } catch (error) {
                reject(error);
            };
        });
    };

    async initGunModel(that) {
        return new Promise(async (resolve, reject) => {
            try {
                this.Gun = await this.third.load.gltf(this.http + this.path_models + 'blaster-e.glb');
                that.Gun = this.Gun;
                resolve();
            } catch (error) {
                reject(error);
            };
        });
    };

    async initLanternModel(that) {
        return new Promise(async (resolve, reject) => {
            try {
                this.Lantern = await this.third.load.gltf(this.http + this.path_models + 'lantern-candle.glb');
                that.Lantern = this.Lantern;
                resolve();
            } catch (error) {
                reject(error);
            };
        });
    };

    async world() {
        return new Promise(async (resolve, reject) => {
            const GameWorldScene = await this.third.load.gltf(this.http + this.path_models + 'GameWorldScene.glb');
            const GameWorldScenePhysics = this.physicsScene.add(GameWorldScene.scene);
            GameWorldScenePhysics.position.set(2.6, -2, -1.1);
            GameWorldScenePhysics.traverse(child => {
                /** @abstract Mesh */
                if (child.isMesh) {
                    /** @abstract Player action area */
                    if (child.name.indexOf('Mesh_floor')) {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };

                    /** @abstract Player obstacle area */
                    if (child.name.indexOf('Mesh_beach')) {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name.indexOf('Mesh_mine')) {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name.indexOf('Mesh_beach')) {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name.indexOf('Mesh_grass')) {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name.indexOf('iron-fence')) {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name.indexOf('crypt-small')) {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                };
            });
            this.third.add.existing(GameWorldScenePhysics);
            resolve();
        });
    };

    async treasureHunt() {
        return new Promise(async (resolve, reject) => {
            const treasureHunt = await this.third.load.gltf(this.http + this.path_models + 'TreasureHunt.glb');
            const treasureHuntPhysics = this.THPhysics.add(treasureHunt.scene);
            treasureHuntPhysics.scale.set(.6, .6, .6);
            treasureHuntPhysics.position.set(-3.8, -.8, -3.6);
            treasureHuntPhysics.rotation.y -= 0.6;
            treasureHuntPhysics.traverse(child => {
                /** @abstract Mesh */
                if (child.isMesh) {
                    /** @abstract Player action area */
                    if (child.name === 'patch-sand') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name === 'patch-sand001') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name === 'patch-sand002') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name === 'patch-grass') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name === 'patch-grass001') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name === 'patch-grass002') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };

                    /** @abstract Player obstacle area */
                    if (child.name === 'tool-shovel') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name === 'hole') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name === 'palm-bend') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name === 'rocks-a') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                    if (child.name === 'rocks-sand-c') {
                        child.material = true ? child.material : DebugModelsMaterial.init();
                        this.that.GameWorldScenePhysicsElement.push({
                            name: child.name,
                            mesh: child
                        });
                    };
                };
            });
            this.third.add.existing(treasureHuntPhysics);
            resolve();
        });
    };

    async chest() {
        const Chest = await this.third.load.gltf(this.http + this.path_models + 'chest.glb');
        this.that.PhysicsChest = this.physicsChest.add(Chest.scene);
        this.that.PhysicsChest.scale.set(.6, .6, .6);
        this.that.PhysicsChest.position.set(0, 30, 0);
        this.that.PhysicsChest.rotation.y = Math.PI / 2;
        this.third.scene.add(this.that.PhysicsChest);
        this.third.animationMixers.add(this.that.PhysicsChest.anims.mixer);
        Chest.animations.forEach(clip => {
            this.that.ChestAnimaMap.push(this.that.PhysicsChest.anims.mixer.clipAction(clip));
        });
    };

    async player() {
        return new Promise(async (resolve, reject) => {
            const Player = await this.third.load.gltf(this.http + this.path_models + 'character-vampire.glb');
            this.that.PlayerOrig = Player;
            this.that.PlayerPhysics = this.physicsPlayer.add(Player.scene);
            this.that.PlayerPhysics.position.set(this.that.PlayerPhysicsData.coordinate.x, -.9, this.that.PlayerPhysicsData.coordinate.y);
            this.that.PlayerPhysics.uuid = this.that.PlayerPhysicsData.playerDataType.id;
            this.that.PlayerPhysics.hp = this.that.PlayerPhysicsData.playerDataType.hp;
            this.that.PlayerPhysics.traverse((child) => {
                if (child.name === "leg-left") {
                    this.that.PlayerPhysicsLeftHand = child;
                };
                if (child.name === "leg-right") {
                    this.that.PlayerPhysicsRightHand = child;
                };
            });
            this.third.physics.add.existing(this.that.PlayerPhysics, {
                mass: 1,
                collisionFlags: 2,
                shape: 'box'
            });
            this.that.PlayerPhysics.body.setGravity(0, 0, 0);
            this.third.scene.add(this.that.PlayerPhysics);
            this.third.animationMixers.add(this.that.PlayerPhysics.anims.mixer);
            Player.animations.forEach(clip => {
                this.that.PlayerAnimaMap.push(this.that.PlayerPhysics.anims.mixer.clipAction(clip));
            });
            this.that.PlayerAnimaMap[1].reset().play();

            CreatePlayerStatus.init.call(this.that, { x: this.that.PlayerPhysics.position.x, z: this.that.PlayerPhysics.position.z, hp: this.that.PlayerPhysicsData.playerDataType.hp, uuid: this.that.PlayerPhysicsData.playerDataType.id });

            resolve();

        });
    };

    async npc() {
        return new Promise(async (resolve, reject) => {
            if (ZOMB_COORD && ZOMB_COORD.coordinate.length >= 0) {
                let GhostPhysics = [];
                await Promise.all(ZOMB_COORD.coordinate.map(async (item, index) => {
                    const mesh = this.Ghost.scene.clone();
                    const ghostItems = new ExtendedObject3D().add(mesh);
                    ghostItems.position.set(item.coordinate.x, -.9, item.coordinate.z);
                    ghostItems.rotation.y = Math.floor(Math.random() * 5);
                    ghostItems.uuid = ZOMB_COORD.zombie[index].uuid;

                    GhostPhysics.push({
                        name: item.name,
                        coordinate: item,
                        data: ZOMB_COORD.zombie[index],
                        example: ghostItems,
                        anima: this.Ghost,
                        play: [],
                        mesh: []
                    });

                    this.third.physics.add.existing(ghostItems, {
                        mass: 1,
                        collisionFlags: 2,
                        shape: 'box'
                    });
                    ghostItems.body.setGravity(0, 0, 0);
                    this.third.scene.add(ghostItems);

                    this.third.animationMixers.add(ghostItems.anims.mixer);

                    if (GhostPhysics.length === ZOMB_COORD.coordinate.length) {
                        GhostPhysics.forEach(item => {
                            CreateNpcStatus.init.call(this.that, { x: item.coordinate.coordinate.x, z: item.coordinate.coordinate.z, data: item.data });
                            item.anima.animations.forEach(clip => {
                                item.play.push(item.example.anims.mixer.clipAction(clip));
                            });
                            item.example.traverse(child => {
                                if (child.isMesh) {
                                    child.uuid = item.data.uuid;
                                    if (child.name === 'torso') {
                                        item.mesh.push({
                                            name: child.name,
                                            mesh: child
                                        });
                                    };
                                };
                            });
                        });

                        GhostPhysics.forEach(item => {
                            item.play[1].reset().play();
                        });
                        resolve(GhostPhysics);
                    };
                }));
            } else {
                reject([]);
            };
        });
    };

    async digger() {
        const Digger = await this.third.load.gltf(this.http + this.path_models + 'character-digger.glb');
        this.that.PhysicsDigger = this.physicsDigger.add(Digger.scene);
        this.that.PhysicsDigger.position.set(-3.6, -.8, -3.6);
        this.that.PhysicsDigger.rotation.y = Math.PI / 2;
        this.third.scene.add(this.that.PhysicsDigger);
        this.third.animationMixers.add(this.that.PhysicsDigger.anims.mixer);
        Digger.animations.forEach(clip => {
            this.that.DiggerAnimaMap.push(this.that.PhysicsDigger.anims.mixer.clipAction(clip));
        });
        this.that.DiggerAnimaMap[1].reset().play();
    };

    async brains() {
        const Brains = await this.third.load.gltf(this.http + this.path_models + 'character-skeleton.glb');
        this.that.PhysicsBrains = this.physicsBrains.add(Brains.scene);
        this.that.PhysicsBrains.position.set(-6.9, -.9, 5.6);
        this.that.PhysicsBrains.rotation.y = Math.PI / 2;
        this.third.scene.add(this.that.PhysicsBrains);
        this.third.animationMixers.add(this.that.PhysicsBrains.anims.mixer);
        Brains.animations.forEach(clip => {
            this.that.BrainsAnimaMap.push(this.that.PhysicsBrains.anims.mixer.clipAction(clip));
        });
        this.that.BrainsAnimaMap[1].reset().play();
    };

    async brain(weight) {
        const colors = {
            waste: 0x808080,
            ordinary: 0xffffff,
            rare: 0x0000ff,
            epic: 0xf800080,
            legend: 0xff0000
        };

        this.that.floorCircle.position.set(0, -.5, 0);
        this.that.floorCircle.body.needUpdate = true;
        weight.map(str => {
            const GHOST_RANDOM_RADIUS = Math.sqrt(Math.random()) * 1.5;
            const GHOST_ANGLE_STEP = Math.random() * Math.PI * 2;

            const X = ATTACK_LOCK_GHOST_POS.x + GHOST_ANGLE_STEP * Math.cos(GHOST_RANDOM_RADIUS);
            const Z = ATTACK_LOCK_GHOST_POS.z + GHOST_ANGLE_STEP * Math.sin(GHOST_RANDOM_RADIUS);
            const mesh = this.Brain.scene.clone();
            const brainItem = new ExtendedObject3D().add(mesh);
            brainItem.uuid = JSON.parse(str).uuid;
            brainItem.scale.set(.02, .02, .02);
            brainItem.rotation.y = Math.floor(Math.random() * 5);
            brainItem.position.set(X, 2, Z);
            brainItem.traverse((child) => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhongMaterial({
                        color: colors[JSON.parse(str).type] || colors.ordinary,
                        transparent: true,
                        opacity: 0.5,
                    });
                    child.uuid = brainItem.uuid;
                };
            });
            this.third.physics.add.existing(brainItem, {
                mass: 1,
                shape: 'box'
            });

            brainItem.body.setRestitution(0.1);
            this.third.scene.add(brainItem);
            this.that.brainItems.push(brainItem);
        });

    };

    async ship() {
        const ship = await this.third.load.fbx(this.http + this.path_models + 'ship-large.fbx');
        ship.scale.set(.003, .003, .003);
        ship.position.set(.5, -1.5, 8);
        this.third.scene.add(ship);
    };

    async pumpkinWeapon() {
        const Pumpkin = await this.third.load.gltf(this.http + this.path_models + 'pumpkin.glb');
        this.that.PhysicsPumpkin = this.physicsPumpkin.add(Pumpkin.scene);
        this.that.PhysicsPumpkin.position.set(0, 30, 0);
        this.third.scene.add(this.that.PhysicsPumpkin);
    };

    async chestEquipment(weight) {
        this.that.floorCircle.position.set(0, -.5, 0);
        this.that.floorCircle.body.needUpdate = true;

        weight.map(str => {
            const GHOST_RANDOM_RADIUS = Math.sqrt(Math.random()) * 1.5;
            const GHOST_ANGLE_STEP = Math.random() * Math.PI * 2;

            const item = JSON.parse(str);
            const X = this.that.PlayerPhysics.position.x + GHOST_ANGLE_STEP * Math.cos(GHOST_RANDOM_RADIUS);
            const Z = this.that.PlayerPhysics.position.z + GHOST_ANGLE_STEP * Math.sin(GHOST_RANDOM_RADIUS);
            const mesh = this[item.type.key].scene.clone();
            const extObjItem = new ExtendedObject3D().add(mesh);
            extObjItem.ids = item.type.id;
            extObjItem.uuid = item.uuid;
            extObjItem.position.set(X, 2, Z);
            extObjItem.traverse((child) => {
                if (child.isMesh) {
                    child.ids = extObjItem.ids;
                    child.uuid = extObjItem.uuid
                };
            });
            this.third.physics.add.existing(extObjItem, {
                mass: 1,
                shape: 'box'
            });

            extObjItem.body.setRestitution(0.1);
            this.third.scene.add(extObjItem);
            this.that.chestEquItems.push(extObjItem);
        });
    };

};

class CreateNpcStatus {
    static init(coordinate) {
        const geometry = new THREE.PlaneGeometry(1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const bloodBar = new THREE.Mesh(geometry, material);
        bloodBar.uuid = coordinate.data.uuid;
        bloodBar.position.set(coordinate.x, .2, coordinate.z);
        bloodBar.scale.set(coordinate.data.hp / coordinate.data.hp, coordinate.data.hp / coordinate.data.hp, coordinate.data.hp / coordinate.data.hp);
        this.NPCBloodBars.push(bloodBar);
        this.third.scene.add(bloodBar);
    };

    static async updateStatus(data) {
        const scaleX = data.count;
        data.bloodBar.scale.x = scaleX;

        if (data.bloodBar.scale.x > 1) {
            data.bloodBar.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({ color: "#ffa500", side: THREE.DoubleSide });
                };
            });
        };

        if (data.bloodBar.scale.x <= .6) {
            data.bloodBar.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({ color: "#c4c400", side: THREE.DoubleSide });
                };
            });
        };

        if (data.bloodBar.scale.x <= .2) {
            data.bloodBar.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({ color: "#bebebe", side: THREE.DoubleSide });
                };
            });
        };

        const sceneFightText = await CreateSceneTextMessage.main.call(this, {
            pos: data.bloodBar.position,
            text: '进入战斗'
        });

        if (sceneFightText.uuid) {
            gsap.to(sceneFightText.position, {
                y: 2,
                duration: 1.5,
                ease: "power2.out",
                onComplete: () => {
                    this.third.scene.remove(sceneFightText);
                }
            });
        };

        GO_INTO_ACTION = true;
        HtmlSubscription.publish('fight', true);
    };

};

class CreatePlayerStatus {
    static init(coordinate) {
        const geometry = new THREE.PlaneGeometry(1, 0.1);
        const material = new THREE.MeshBasicMaterial({ color: 0x4A00E0, transparent: true, opacity: .5, side: THREE.DoubleSide });
        const bloodBar = new THREE.Mesh(geometry, material);
        bloodBar.uuid = coordinate.uuid;
        bloodBar.position.set(coordinate.x, .2, coordinate.z);
        bloodBar.scale.set(coordinate.hp / coordinate.hp, coordinate.hp / coordinate.hp, coordinate.hp / coordinate.hp);
        this.PlayerBloodBar = bloodBar;
        this.third.scene.add(bloodBar);
    };

    static updateStatus(data) {
        const scaleX = data.count;
        data.bloodBar.scale.x = scaleX;

        if (data.bloodBar.scale.x <= .6) {
            data.bloodBar.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({ color: "#c4c400", side: THREE.DoubleSide });
                };
            });
        };

        if (data.bloodBar.scale.x <= .2) {
            data.bloodBar.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshPhysicalMaterial({ color: "#bebebe", side: THREE.DoubleSide });
                };
            });
        };

    };
};

class CreateAttackRange {

    player(show) {
        const geometry = new THREE.CircleGeometry(4, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: show ? 0.5 : 0
        });
        this.playerCircle = new THREE.Mesh(geometry, material);
        this.playerCircle.rotation.x = Math.PI / 2; // if not show plase set -2

        this.third.physics.add.existing(this.playerCircle, {
            mass: 1,
            collisionFlags: 2,
            shape: 'mesh'
        });
        this.playerCircle.body.setGravity(0, 0, 0);

        this.third.scene.add(this.playerCircle);
        this.openPlayerAR = true;
    };

    playerWarningArea(show) {
        const geometry = new THREE.CircleGeometry(1, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: show ? 0.5 : 0
        });
        this.playerCircleWA = new THREE.Mesh(geometry, material);
        this.playerCircleWA.rotation.x = Math.PI / 2;

        this.third.physics.add.existing(this.playerCircleWA, {
            mass: 1,
            collisionFlags: 2,
            shape: 'mesh'
        });
        this.playerCircleWA.body.setGravity(0, 0, 0);

        this.third.scene.add(this.playerCircleWA);
        this.openPlayerARForWA = true;
    };

    npc(show) {

    };

    zombieWall(show) {
        const geometry = new THREE.BoxGeometry(4, 6, -2);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: show ? 0.5 : 0
        });
        this.zombieWall = new THREE.Mesh(geometry, material);
        this.zombieWall.rotation.x = Math.PI / 2;
        this.zombieWall.position.set(-6.8, 0, 5.5);

        this.third.physics.add.existing(this.zombieWall, {
            mass: 1,
            collisionFlags: 2,
            shape: 'box'
        });
        this.zombieWall.body.setGravity(0, 0, 0);

        this.third.scene.add(this.zombieWall);
    };

    diggerWall(show) {
        const geometry = new THREE.BoxGeometry(2, 2, -2);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: show ? 0.5 : 0
        });
        this.diggerWall = new THREE.Mesh(geometry, material);
        this.diggerWall.rotation.x = Math.PI / 2;
        this.diggerWall.position.set(-3.6, 0, -3.6);

        this.third.physics.add.existing(this.diggerWall, {
            mass: 1,
            collisionFlags: 2,
            shape: 'box'
        });
        this.diggerWall.body.setGravity(0, 0, 0);

        this.third.scene.add(this.diggerWall);
    };

    chestWall(show) {
        const geometry = new THREE.BoxGeometry(2, 2, -2);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: show ? 0.5 : 0
        });
        this.chestWall = new THREE.Mesh(geometry, material);
        this.chestWall.rotation.x = Math.PI / 2;
        this.chestWall.position.set(-.5, 0, -5.4);

        this.third.physics.add.existing(this.chestWall, {
            mass: 1,
            collisionFlags: 2,
            shape: 'box'
        });
        this.chestWall.body.setGravity(0, 0, 0);

        this.third.scene.add(this.chestWall);
    };

    pumpkinWeapon(show) {
        const geometry = new THREE.CircleGeometry(.4, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: show ? 0.5 : 0
        });
        this.pumpkinWeaponCircle = new THREE.Mesh(geometry, material);
        this.pumpkinWeaponCircle.rotation.x = Math.PI / 2;

        this.third.physics.add.existing(this.pumpkinWeaponCircle, {
            mass: 1,
            collisionFlags: 2,
            shape: 'mesh'
        });
        this.pumpkinWeaponCircle.body.setGravity(0, 0, 0);

        this.third.scene.add(this.pumpkinWeaponCircle);
        this.openPumpkinWeaponAR = true;
    };

    floor() {
        const geometry = new THREE.BoxGeometry(0, 0);
        this.floorCircle = new THREE.Mesh(geometry);
        this.floorCircle.rotation.x = Math.PI / -2;
        this.floorCircle.position.set(0, 30, 0);

        this.third.physics.add.existing(this.floorCircle, {
            mass: 0,
            collisionFlags: 2,
            shape: 'box',
            width: 20,
            height: 20,
            depth: .1
        });

        this.floorCircle.body.setRestitution(0.1);
        this.third.scene.add(this.floorCircle);

    };
};

/**
 * @class CreateSkillList
 * @description skill list *Q: Tracking attacks. *W: normal attack.
 */
class CreateSkillList {
    Q() {
        this.input.keyboard.on('keydown-Q', () => {
            if (this.findNPCImgMark.position.y === 30) return this.io.getAdvertiseSceneGameMessage('1');
            const pos = this.GhostMarkPhysics.exa.position;
            const uuid = this.GhostMarkPhysics.uuid;
            if (CreateCombatSystem.myLinkedList.findItem(uuid) === null) {
                if (this.findNPCImgMark.position.y === 30) return this.io.getAdvertiseSceneGameMessage('1');
                this.io.getAdvertiseSceneGameMessage('2');
            } else {
                ATTACK_LOCK_GHOST_UUID = uuid;
                ATTACK_LOCK_GHOST_POS = pos;
                CreateSkillQ.main(this);
            };
        });
    };

};

/**
 * @class CreateSkillQ
 * @description special skill - track
 */
class CreateSkillQ {
    static Q(that) {
        if (that.OpenPumpkinWeaponMove) return delete CreateSkillQ.instance;
        CreateBiologyActAnima.playerAttack.call(that);
        CreateSkillQ.CreatePumpkinWeapon(that);
        HtmlSubscription.publish("skill_Q", 1);
    };

    static CreatePumpkinWeapon(that) {
        if (that.pumpkinWeaponMove) {
            that.pumpkinWeaponMove = null;
            that.progress_pumpkin = PROGRESS_PUMPKIN;
            that.velocity_pumpkin = CONSTANT_VELOCITY_PUMPKIN;
        };
        that.pumpkinWeaponMove = new CreateNavigationPath(that, that.GroundNavMesh, that.PlayerPhysics.position, that.ghostPos, 'wave');
        that.OpenPumpkinWeaponMove = true;
    };

    static main(that) {
        if (!CreateSkillQ.instance) {
            CreateSkillQ.instance = new CreateSkillQ();
            CreateSkillQ.Q(that);
        };
        return CreateSkillQ.instance;
    };
};

/**
 * @class CreateMinersSpeakTalk
 * @description Miner speech copywriting
 */
class CreateMinersSpeakTalk {
    static talk() {
        socket.emit('SceneGameMinerChat', {
            type: 'talk',
            body: 'Copywriting-one'
        });
    };

    static main() {
        if (!CreateMinersSpeakTalk.instance) {
            CreateMinersSpeakTalk.instance = new CreateMinersSpeakTalk();
            CreateMinersSpeakTalk.talk();
        };
        return CreateMinersSpeakTalk.instance;
    };
};

/**
 * @class CreateMinersSpeakAskFor
 * @description Miner speech copywriting
 */
class CreateMinersSpeakAskFor {
    static askFor() {
        socket.emit('SceneGameMinerChat', {
            type: 'talk',
            body: 'Copywriting-two'
        });
    };

    static main() {
        if (!CreateMinersSpeakAskFor.instance) {
            CreateMinersSpeakAskFor.instance = new CreateMinersSpeakAskFor();
            CreateMinersSpeakAskFor.askFor();
        };
        return CreateMinersSpeakAskFor.instance;
    };
};

/**
 * @class CreateZombiesSpeakTalk
 * @description Zombie speech copywriting
 */
class CreateZombiesSpeakTalk {
    static talk() {
        socket.emit('SceneGameZombieChat', {
            type: 'talk',
            body: 'Copywriting-one'
        });
    };

    static main() {
        if (!CreateZombiesSpeakTalk.instance) {
            CreateZombiesSpeakTalk.instance = new CreateZombiesSpeakTalk();
            CreateZombiesSpeakTalk.talk();
        };
        return CreateZombiesSpeakTalk.instance;
    };
};

/**
 * @class CreateZombiesSpeakAskFor
 * @description Zombie speech copywriting
 */
class CreateZombiesSpeakAskFor {
    static askFor() {
        socket.emit('SceneGameZombieChat', {
            type: 'talk',
            body: 'Copywriting-two'
        });
    };

    static main() {
        if (!CreateZombiesSpeakAskFor.instance) {
            CreateZombiesSpeakAskFor.instance = new CreateZombiesSpeakAskFor();
            CreateZombiesSpeakAskFor.askFor();
        };
        return CreateZombiesSpeakAskFor.instance;
    };
};

class CreateCombatSystem {
    static myLinkedList = new LinkedList();
    static ghost = null;
    static listenToGhost(npcs) {
        CreateCombatSystem.ghost = npcs;
        npcs.map(item => {
            /** Listen player and ghost */
            this.third.physics.add.collider(this.playerCircle, item.exa, collisionInfo => {
                if (collisionInfo === 'start') {
                    CreateCombatSystem.myLinkedList.append(JSON.stringify({ id: item.uuid, ghost: [] }));
                    // CreateCombatSystem.myLinkedList.print();
                };
                if (collisionInfo === 'end') {
                    CreateCombatSystem.myLinkedList.removeItem(item.uuid);
                    // CreateCombatSystem.myLinkedList.print();
                };
            });

            /** Listen pumpkinWeapon and ghost */
            this.third.physics.add.collider(this.pumpkinWeaponCircle, item.exa, collisionInfo => {
                if (collisionInfo === 'start') {
                    this.OpenPumpkinWeaponMove = false;
                    this.PhysicsPumpkin.position.set(0, 30, 0);
                    if (item.exa.uuid !== ATTACK_LOCK_GHOST_UUID) return;
                    item.exa.traverse(child => {
                        if (child.isMesh) {
                            if (child.name === "arm-left" || child.name === "arm-right") {
                                const originalColor = child.material.color.clone();
                                child.material = new THREE.MeshPhysicalMaterial({ color: 0xff0000, side: THREE.DoubleSide });
                                const timer = setTimeout(() => {
                                    child.material.color.copy(originalColor);;
                                    clearTimeout(timer);
                                }, 100);
                            };
                        };
                    });

                    this.ghostPos = item.exa.position;
                    this.GhostPhysicsItem = item.exa;
                    this.GhostPhysicsItemAnima = item.play;

                    CreateBiologyActAnima.ghostBeHit(item);
                    socket.emit('privateSceneGameGhostBloodBar', JSON.stringify({ type: 'BC', body: ATTACK_LOCK_GHOST_UUID }));
                };
            });

        });
    };

    static markGhost(that, uuid) {
        that.GhostMarkPhysics = {
            uuid: uuid,
            exa: CreateCombatSystem.ghost.find(item => item.uuid === uuid).exa
        };
        that.openPlayerFindGhostMark = true;
        return CreateCombatSystem.myLinkedList.findItem(uuid);
    };
};

class CreateAIModelSystem {

    listenOpenAISystem() {
        this.third.physics.add.collider(this.playerCircleWA, this.zombieWall, collisionInfo => {
            if (collisionInfo === 'start') {
                this.openAISys = true;
                this.findNPCImgWho.position.set(this.PhysicsBrains.position.x, this.PhysicsBrains.position.y + 1.2, this.PhysicsBrains.position.z);

                if (CreateZombiesSpeakAskFor.instance) delete CreateZombiesSpeakAskFor.instance;
                CreateZombiesSpeakTalk.talk();
            };
            if (collisionInfo === 'end') {
                this.openAISys = false;
                this.findNPCImgWho.position.set(0, 30, 0);

                if (CreateZombiesSpeakTalk.instance) delete CreateZombiesSpeakTalk.instance;
                CreateZombiesSpeakAskFor.askFor();
            };
        });
    };

};

class CreateTHGameSystem {

    listenOpenTHGameSystem() {
        this.third.physics.add.collider(this.playerCircleWA, this.diggerWall, collisionInfo => {
            if (collisionInfo === 'start') {
                this.openTHGameSys = true;
                this.findNPCImgWho.position.set(this.PhysicsDigger.position.x, this.PhysicsDigger.position.y + 1.4, this.PhysicsDigger.position.z);

                if (CreateMinersSpeakAskFor.instance) delete CreateMinersSpeakAskFor.instance;
                CreateMinersSpeakTalk.talk();
            };
            if (collisionInfo === 'end') {
                this.openTHGameSys = false;
                this.findNPCImgWho.position.set(0, 30, 0);

                if (CreateMinersSpeakTalk.instance) delete CreateMinersSpeakTalk.instance;
                CreateMinersSpeakAskFor.askFor();
            };
        });

        this.third.physics.add.collider(this.playerCircleWA, this.chestWall, collisionInfo => {
            if (collisionInfo === 'start') {
                this.openTHGameChest = true;
                if (this.PhysicsChest.position.y <= 0) CreateBiologyActAnima.chestOpen.call(this, 2);
            };
            if (collisionInfo === 'end') {
                this.openTHGameChest = false;
            };
        });
    };

};

class CreateGhostATKPlayer {

    listenGhostPlayerInteractive() {
        this.phyNpcs.map(item => {
            this.third.physics.add.collider(item.exa, this.playerCircleWA, collisionInfo => {
                if (collisionInfo === 'start') {

                    if (item.exa.uuid !== ATTACK_LOCK_GHOST_UUID) return;
                    console.log('ghost atk player start');

                    CreateBiologyActAnima.ghostAttack(item.play);
                    GHOST_ATK_PLAYER_TIMER = setInterval(() => {
                        /** Ghost ATK timer */
                        CreateBiologyActAnima.ghostAttack(item.play);

                        CreateBiologyActAnima.playerHit.call(this);
                        socket.emit('privateSceneGamePlayerBloodBar', JSON.stringify({ type: 'BC', body: this.PlayerPhysicsData.playerDataType.id }));

                    }, GHOST_ATK_TIMER);

                };
                if (collisionInfo === 'end') {
                    if (item.exa.uuid !== ATTACK_LOCK_GHOST_UUID) return;
                    console.log('ghost atk player end');

                    /** Ghost clear ATK timer */
                    clearInterval(GHOST_ATK_PLAYER_TIMER);

                };
            });
        });
    };

};

class CreateListenPhysicsGameWorldBiology {
    static listenPlayer() {
        this.watchOpenPlayerMove = this.watch(this.OpenPlayerMove, (o, n) => {
            this.OpenPlayerMove = n;
            if (this.OpenPlayerMove) {
                CreateBiologyActAnima.playerMove.call(this);
            } else {
                CreateBiologyActAnima.playerStop.call(this);
            };
        });
    };

    static listenPumpkinWeapon() {
        this.watchOpenPumpkinWeaponMove = this.watch(this.OpenPumpkinWeaponMove, (o, n) => {
            this.OpenPumpkinWeaponMove = n;
            this.PhysicsPumpkin.position.set(0, 30, 0);
        });
    };

    static listenGhost() {
        this.watchOpenGhostMove = this.watch(this.OpenGhostMove, (o, n) => {
            this.OpenGhostMove = n;
            if (this.OpenGhostMove) {
                CreateBiologyActAnima.ghostMove.call(this);
            } else {
                CreateBiologyActAnima.ghostStop.call(this);
            };
        });
    };
};


let bubble = null;
let mark = null
let who = null;
class CreateSceneImage extends Http {

    async PlayerEmoji() {
        const atlas = await this.third.load.texture(this.http + this.path_img + 'emote_exclamation.png');
        bubble = new FLAT.Button(atlas, 2, 3, 0);
        bubble.setInteractive();
        bubble.name = 'player-img-question';
        bubble.position.set(0, 30, 0);
        bubble.setScale(.015);
        bubble.flipX(true);
        this.third.scene.add(bubble);
        return bubble;
    };

    async GhostMark() {
        const atlas = await this.third.load.texture(this.http + this.path_img + 'platformPack_tile022.png');
        mark = new FLAT.Button(atlas, 2, 3, 0);
        mark.setInteractive();
        mark.name = 'npc-img-mark';
        mark.position.set(0, 30, 0);
        mark.setScale(.015);
        mark.flipX(true);
        this.third.scene.add(mark);
        return mark;
    };

    async BrainsEmoji() {
        const atlas = await this.third.load.texture(this.http + this.path_img + 'emote_question.png');
        who = new FLAT.Button(atlas, 2, 3, 0);
        who.setInteractive();
        who.name = 'npc-img-who';
        who.position.set(0, 30, 0);
        who.setScale(.015);
        who.flipX(true);
        this.third.scene.add(who);
        return who;
    };

};

class CreateExecuteSceneImage {
    static playerEmoji(that) {
        that.watchOpenPlayerMove.value = false;
        that.openPlayerFindNPCQuestion = true;
        const time = setTimeout(() => {
            that.openPlayerFindNPCQuestion = false;
            bubble.position.set(0, 30, 0);
            delete CreateExecuteSceneImage.instance;
            clearTimeout(time);
        }, 3000);
    };

    static main(that) {
        if (!CreateExecuteSceneImage.instance) {
            CreateExecuteSceneImage.instance = new CreateExecuteSceneImage();
            CreateExecuteSceneImage.playerEmoji(that);
        };
        return CreateExecuteSceneImage.instance;
    };
};

class CreateEquipmentDropSystem {
    static weight(uuid) {
        HtmlSubscription.publish("killGhostEDWeight", uuid);
    };

    static main(uuid) {
        if (!CreateEquipmentDropSystem.instance) {
            CreateEquipmentDropSystem.instance = new CreateEquipmentDropSystem();
            CreateEquipmentDropSystem.weight(uuid);
        };
        return CreateEquipmentDropSystem.instance;
    };
};

class CreateBiologyActAnima {
    static playerAttack() {
        this.PlayerAnimaMap[10].setLoop(THREE.LoopOnce);
        this.PlayerAnimaMap[10].reset().play();
    };

    static playerMove() {
        this.PlayerAnimaMap[1].stop();
        this.PlayerAnimaMap[2].reset().play();
    };

    static playerStop() {
        this.PlayerAnimaMap[2].stop();
        this.PlayerAnimaMap[1].reset().play();
    };

    static playerDie() {
        this.PlayerAnimaMap[9].setLoop(THREE.LoopOnce);
        this.PlayerAnimaMap[9].clampWhenFinished = true;
        this.PlayerAnimaMap[9].reset().play();
    };

    static playerHit() {
        this.PlayerAnimaMap[7].setLoop(THREE.LoopOnce);
        this.PlayerAnimaMap[7].reset().play();
    };

    static ghostBeHit(item) {
        item.play[7].setLoop(THREE.LoopOnce);
        item.play[7].reset().play();
    };

    static ghostDie(item) {
        return new Promise((resolve, reject) => {
            item.play[9].setLoop(THREE.LoopOnce);
            item.play[9].clampWhenFinished = true;
            item.play[9].reset().play();
            let timer = setTimeout(() => {
                clearTimeout(timer);
                resolve();
            }, 1000);
        });
    };

    static ghostMove() {
        this.GhostPhysicsItemAnima[1].stop();
        this.GhostPhysicsItemAnima[2].reset().play();
    };

    static ghostStop() {
        this.GhostPhysicsItemAnima[2].stop();
        this.GhostPhysicsItemAnima[1].reset().play();
    };

    static ghostDisappear(item) {
        return new Promise((resolve, reject) => {
            gsap.to(item.example.position, {
                y: -1.2,
                duration: 2,
                ease: "power2.out",
                onUpdate: () => {
                    item.example.body.needUpdate = true;
                },
                onComplete: () => {
                    resolve();
                }
            });
        });
    };

    static ghostAttack(item) {
        item[10].setLoop(THREE.LoopOnce);
        item[10].reset().play();
    };

    static chestOpen(num) {
        this.ChestAnimaMap[num].setLoop(THREE.LoopOnce);
        this.ChestAnimaMap[num].clampWhenFinished = true;
        this.ChestAnimaMap[num].reset().play();
    };

    static playersImageMove(item) {
        item[1].stop();
        item[2].reset().play();
    };

    static playersImageStop(item) {
        item[2].stop();
        item[1].reset().play();
    };
};

class CreateSceneTextMessage {
    static playerFight(obj) {
        return new Promise((resolve, reject) => {
            const texture = new FLAT.TextTexture(obj.text);
            const sprite3d = new FLAT.TextSprite(texture);
            this.third.scene.add(sprite3d);
            sprite3d.position.set(obj.pos.x, 1, obj.pos.z);
            sprite3d.setScale(0.01);

            return resolve(sprite3d);
        });
    };

    static async main(obj) {
        if (!CreateSceneTextMessage.instance) {
            CreateSceneTextMessage.instance = new CreateSceneTextMessage();
            return await CreateSceneTextMessage.playerFight.call(this, obj);
        };
        return CreateSceneTextMessage.instance;
    };
};

class CreateSceneTextPlayerName {
    constructor() { };

    init() {
        const name = window.localStorage.getItem('PlayerName');
        if (name) {
            const texture = new FLAT.TextTexture(name);
            this.playerNameTextSprite = new FLAT.TextSprite(texture);
            this.third.scene.add(this.playerNameTextSprite);
            this.playerNameTextSprite.position.set(this.PlayerPhysics.position.x, .5, this.PlayerPhysics.position.z);
            this.playerNameTextSprite.setScale(0.005);

            this.OpenPlayerNameTextSpriteMove = true;
        };
    };
};

class CreatePlayerHandWeapon {
    static MESH_GUN = null;
    static MESH_LANTERN = null;
    static initPlayerWearModel(model, hand) {
        const mesh_hand = this[model].scene.clone();
        const extObjItem_hand = new ExtendedObject3D().add(mesh_hand);
        extObjItem_hand.modelType = 'playerWearModel';
        extObjItem_hand.playerId = this.PlayerPhysicsData.playerDataType.id;
        extObjItem_hand.position.set(0, 30, 0);

        this.third.scene.add(extObjItem_hand);

        hand === 'left' ? CreatePlayerHandWeapon.MESH_GUN = mesh_hand : CreatePlayerHandWeapon.MESH_LANTERN = mesh_hand;

        hand === 'left' ? CreatePlayerHandWeapon.wear.call(this, mesh_hand, 'PlayerPhysicsLeftHand') : CreatePlayerHandWeapon.wear.call(this, mesh_hand, 'PlayerPhysicsRightHand');
    };

    static wear(mesh, key) {
        this[key].attach(mesh);
        key === 'PlayerPhysicsLeftHand' ? mesh.position.set(0.2, 0, 0.8) : mesh.position.set(-0.2, -0.2, 0);
        key !== 'PlayerPhysicsLeftHand' ? this.openPointLantern = true : null;

        mesh.rotation.set(0, Math.PI / 1, 0);
    };

    static removeWear(model, key) {
        this[key].remove(CreatePlayerHandWeapon[model]);
        this.third.scene.remove(CreatePlayerHandWeapon[model]);
    };
};

class CreateSceneNight {
    constructor(that) {
        const point_one = that.third.lights.pointLight({ color: 0x00ff7f, intensity: 6, distance: 16 });
        point_one.position.set(7.4, 0, 3.2);
        const point_two = that.third.lights.pointLight({ color: 0x00ff7f, intensity: 2, distance: 10 });
        point_two.position.set(2.4, 0, 5.8);
        that.point_lantern = that.third.lights.pointLight({ color: 0xffffff, intensity: 2, distance: 6 });
        that.point_lantern.position.set(0, 30, 0);

        // that.third.lights.helper.pointLightHelper(point_two);
    };
};

class CreateEnchant {
    static fireGeometry = null;
    static particleCount = null;
    static time = 0;
    static speed = 0.00005;
    static baseWidth = 0.5;
    static baseHeight = 0.8;
    static particles() {

        const fireMaterial = new THREE.PointsMaterial({
            map: new THREE.TextureLoader().load(this.http + this.path_img + 'skull-particle.png'),
            color: 0xffaa00,
            size: 0.25,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        CreateEnchant.fireGeometry = new THREE.BufferGeometry();
        CreateEnchant.particleCount = 50;

        const positions = new Float32Array(CreateEnchant.particleCount * 3);
        const colors = new Float32Array(CreateEnchant.particleCount * 3);
        const sizes = new Float32Array(CreateEnchant.particleCount);

        for (let i = 0; i < CreateEnchant.particleCount; i++) {

            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * CreateEnchant.baseWidth;
            positions[i3 + 1] = Math.random() * 0.5;
            positions[i3 + 2] = (Math.random() - 0.5) * CreateEnchant.baseWidth;

            colors[i3] = 0.8 + Math.random() * 0.2; // R
            colors[i3 + 1] = 0.2 + Math.random() * 0.3; // G
            colors[i3 + 2] = Math.random() * 0.2; // B

            sizes[i] = 0.1 + Math.random() * 0.2;
        };

        CreateEnchant.fireGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        CreateEnchant.fireGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        CreateEnchant.fireGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        this.fireParticles = new THREE.Points(CreateEnchant.fireGeometry, fireMaterial);
        this.fireParticlesModel = new THREE.Group();
        this.fireParticlesModel.add(this.fireParticles);
        this.third.scene.add(this.fireParticlesModel);
    };

    static animateFire() {
        CreateEnchant.time += CreateEnchant.speed;

        const positions = CreateEnchant.fireGeometry.attributes.position.array;
        const colors = CreateEnchant.fireGeometry.attributes.color.array;

        for (let i = 0; i < CreateEnchant.particleCount; i++) {
            const i3 = i * 3;

            positions[i3 + 1] += CreateEnchant.speed + Math.random() * 0.02;
            positions[i3] += (Math.random() - 0.5) * CreateEnchant.speed;
            positions[i3 + 2] += (Math.random() - 0.5) * CreateEnchant.speed;

            if (positions[i3 + 1] > 1) {
                positions[i3 + 1] = Math.random() * 0.1;
                positions[i3] = (Math.random() - 0.5) * CreateEnchant.baseWidth * 1.2;
                positions[i3 + 2] = (Math.random() - 0.5) * CreateEnchant.baseWidth * 1.2;
            }

            const fade = 1 - (positions[i3 + 1] / 1.5);
            colors[i3] = 0.8 + Math.random() * 0.2;
            colors[i3 + 1] = fade * (0.2 + Math.random() * 0.3);
            colors[i3 + 2] = fade * Math.random() * 0.2;
        }

        CreateEnchant.fireGeometry.attributes.position.needsUpdate = true;
        CreateEnchant.fireGeometry.attributes.color.needsUpdate = true;
    };
};


export default class Game extends Scene3D {

    constructor() {
        super({
            key: 'Game'
        });

        this.io = null;

        this.moio = null;

        this.http = `${proxy.development.API}`;
        this.path_img = `${proxy.development.PATH_IMG}`;
        this.path_models = `${proxy.development.PATH_MODELS}`;

        this.ui = null;

        this.PlayerBloodBar = null;

        this.NPCBloodBars = [];
        this.NPCImage = null;

        this.openPlayerAR = false;
        this.playerCircle = null;
        this.playerCircleWA = null;

        this.openPumpkinWeaponAR = false;
        this.pumpkinWeaponCircle = null;

        this.progress = PROGRESS;
        this.velocity = CONSTANT_VELOCITY;

        this.progress_pumpkin = PROGRESS_PUMPKIN;
        this.velocity_pumpkin = CONSTANT_VELOCITY_PUMPKIN;

        this.progress_ghost = PROGRESS_GHOST;
        this.velocity_ghost = CONSTANT_VELOCITY_GHOST;

        this.orbitControls = null;

        this.findNPCImgQuestion = null;
        this.findNPCImgMark = null;
        this.findNPCImgWho = null;

        this.openPlayerFindNPCQuestion = false;
        this.openPlayerFindGhostMark = false;
        this.OpenPlayerMove = false;

        this.PhysicsChest = null;

        this.PlayerMove = null;
        this.PlayerPhysics = null;
        this.PhysicsBrains = null;
        this.PhysicsPumpkin = null;
        this.PhysicsDigger = null;

        this.pumpkinWeaponMove = null;
        this.OpenPumpkinWeaponMove = false;
        this.watchOpenPumpkinWeaponMove = null;

        this.bloodBarMove = null;
        this.GhostPhysicsItem = null;
        this.GhostMove = null;
        this.OpenGhostMove = false;
        this.watchOpenGhostMove = null;

        this.GhostMarkPhysics = null;
        this.GhostPhysics = null;
        this.biology = null;
        this.watchOpenPlayerMove = null;

        this.BrainPhysics = null;

        this.GroundNavMesh = null;
        this.CreateInterstellarCoordinates = null;
        this.OpenCreateInterstellarCoordinates = false;

        this.GameWorldScenePhysicsElement = [];
        this.PlayerAnimaMap = [];
        this.BrainsAnimaMap = [];
        this.DiggerAnimaMap = [];
        this.ChestAnimaMap = [];

        this.meshNpcs = [];
        this.phyNpcs = [];

        this.BrainItems = null;
        this.BrainIndex = null;
        this.brainItems = [];
        this.ChestEquItems = null;
        this.ChestEquIndex = null;
        this.chestEquItems = [];

        this.OpenStartGameLookScene = true;

        this.zombieWall = null;
        this.openAISys = false;

        this.diggerWall = null;
        this.chestWall = null;
        this.openTHGameSys = false;
        this.openTHGameChest = false;

        this.GhostATKPlayer = null;

        this.openPlayersImage = false;
        this.playersAllImage = [];

        this.PlayerOrig = null;

        this.playerNameTextSprite = null;
        this.OpenPlayerNameTextSpriteMove = false;

        this.PlayerMoveCursor = null;

        this.OpenSceneZoomLevel = false;
        this.SceneZoomLevel = null;

        this.PlayerPhysicsLeftHand = null;
        this.PlayerPhysicsRightHand = null;
        this.Gun = null;
        this.Lantern = null;

        this.skys = null;

        this.playerSwitch = window.localStorage.getItem('playerSwitch');

        this.particles = null;

        this.point_lantern = null;

        this.openPointLantern = false;

    };

    async init() {
        this.accessThirdDimension();

        this.io = new SocketRoomData();
        this.io.on();

        /**@description Events */
        socket.on('privateSceneGameMonstersGhost', async obj => {
            if (ZOMB_COORD) {
                ZOMB_COORD = obj;
                this.resetSceneGhostSystem();
            } else {
                ZOMB_COORD = obj;
            };
        });

        /**@description Events */
        socket.on('ghostBloodBarCount', obj => {

            if (obj.count <= 0) return this.killGhostItem(obj.uuid);
            this.bloodBar = this.NPCBloodBars.find(item => item.uuid === obj.uuid);
            CreateNpcStatus.updateStatus.call(this, { bloodBar: this.bloodBar, count: obj.count });

            HtmlSubscription.publish('ai_run', obj.count);

        });

        /**@description Events */
        socket.on('playerBloodBarCount', obj => {

            /** Player die */
            if (obj.count <= 0) {
                HtmlSubscription.publish('hideSaveIcon', false);
                this.playerDisengagement();

                this.ray.unRay();
                this.OpenPlayerMove = false;
                this.orbitControls.enabled = false;
                CreateBiologyActAnima.playerDie.call(this);
                CreateBiologyActAnima.playerStop.call(this);
                this.third.renderer.domElement.style.filter = 'grayscale(100%)';
                socket.emit('SceneGameZombieChat', {
                    type: 'talk',
                    body: 'Copywriting-playerDie'
                });
                return;
            };
            CreatePlayerStatus.updateStatus.call(this, { bloodBar: this.PlayerBloodBar, count: obj.count });

            /** Next version update. */






        });

        /**@description Events */
        socket.on('operateGhostTaskStatus', status => {
            status === 'start' ? HtmlSubscription.publish("ghost_refresh_task", false) : null;
        });

        /**@abstract Events */
        socket.on('EquipmentPicking', obj => {
            HtmlSubscription.publish('ep-count', obj.count);
            this.third.scene.remove(this.BrainItems);
            this.brainItems.splice(this.BrainIndex, 1);
        });

        /**@abstract Events */
        socket.on('THEquipmentPicking', obj => {
            // console.log('@@@', obj);
            // HtmlSubscription.publish('thep-equ', obj);
            this.third.scene.remove(this.ChestEquItems);
            this.chestEquItems.splice(this.ChestEquIndex, 1);
        });

        /**@abstract Events */
        socket.on('SceneGame2DGetBall', obj => {
            HtmlSubscription.publish('game_2d_scene_res_ball');
            HtmlSubscription.publish('kg-count', obj.count);
        });

        /**@abstract Events */
        socket.on('SceneGameKillGhostCount', obj => {
            HtmlSubscription.publish('kg-count', obj.count);
        });

        /**@abstract Events */
        socket.on('privateSceneGameTreasureHunt', obj => {
            this.PhysicsChest.position.set(-1.6, -.8, -5.6);
            HtmlSubscription.publish('stop_th');
        });

        /**@abstract Events */
        socket.on('privateSceneGameTreasureHuntTimer', count => {
            HtmlSubscription.publish('get_th_count_down_done', count);
        });

    };

    async preload() { };

    async create() {

        // this.third.physics.debug.enable();

        const skillList = new CreateSkillList();
        skillList.Q.call(this);

        this.io.getAdvertiseMessage();
        this.io.getZombieCoordinates();

        this.moio = new SocketMultiplayerOnlineRoomData();
        this.moio.players.call(this);

        window.localStorage.getItem('GameOption') === 'new' ? this.PlayerPhysicsData = await this.io.getSceneGamePlayerInit('new') : this.PlayerPhysicsData = await this.io.getSceneGamePlayerInit('read');

        const hdr = new HDR();
        hdr.init.call(this);

        new SeaWater(this, [
            'Water_1_M_Normal.jpg',
            'Water_2_M_Normal.jpg'
        ]);

        this.AR = new CreateAttackRange();
        this.AR.player.call(this, false);
        this.AR.playerWarningArea.call(this, false);
        this.AR.zombieWall.call(this, false);
        this.AR.diggerWall.call(this, false);
        this.AR.chestWall.call(this, false);
        this.AR.pumpkinWeapon.call(this, false);
        this.AR.floor.call(this);

        this.findNPCImage = new CreateSceneImage();
        this.findNPCImgQuestion = await this.findNPCImage.PlayerEmoji.call(this);
        this.findNPCImgMark = await this.findNPCImage.GhostMark.call(this);
        this.findNPCImgWho = await this.findNPCImage.BrainsEmoji.call(this);

        await initRecastNavigation();

        const { orbitControls } = await this.third.warpSpeed('-sky', '-ground', this.playerSwitch == 1 ? '-light' : null);

        CreateCameraDamping.init.call(this, {
            orb: orbitControls,
            name: 'orbitControls'
        });

        this.skys = new CreateSkyBox();
        this.skys.DayAndNight(this, this.playerSwitch == 1 ? ["sky_px.png", "sky_nx.png", "sky_py.png", "sky_ny.png", "sky_pz.png", "sky_nz.png"] : ["city_sky_px.png", "city_sky_nx.png", "city_sky_py.png", "city_sky_ny.png", "city_sky_pz.png", "city_sky_nz.png"]);
        this.playerSwitch == 1 ? new CreateSceneNight(this) : null;

        this.cameraLookSandTable();

        this.biology = new CreatePhysicsGameWorldBiology(this, this.third);
        await this.biology.initGhostModel();
        await this.biology.initBrainModel();
        await this.biology.initCoinModel();
        await this.biology.initFishModel();
        await this.biology.initPotionModel();
        await this.biology.initTrophyModel();
        await this.biology.initClipModel();
        await this.biology.initGunModel(this);
        await this.biology.initLanternModel(this);
        await this.biology.world();
        await this.biology.treasureHunt();
        await this.biology.chest();
        await this.biology.brains();
        await this.biology.digger();
        await this.biology.player();
        this.biology.ship();
        this.biology.pumpkinWeapon();
        this.GhostPhysics = await this.biology.npc();

        const playerMoveCursor = new CreatePlayerMoveCursor();
        playerMoveCursor.init.call(this);

        const playerName = new CreateSceneTextPlayerName();
        playerName.init.call(this);

        CreatePlayerStatus.updateStatus.call(this, { bloodBar: this.PlayerBloodBar, count: this.PlayerPhysicsData.playerDataType.hp / 100 });

        new CreateNavigation(this, [
            ...this.GameWorldScenePhysicsElement.map(item => {
                /**@abstract use Player action area or obstacle area */
                return item.mesh
            })
        ], false, navMesh => {
            this.GroundNavMesh = navMesh;
        });

        this.CreateInterstellarCoordinates = new CreateInterstellarCoordinates(this, new THREE.Vector3(0, 0, 29), 1, .3, bol => {
            if (bol) {
                this.OpenCreateInterstellarCoordinates = true;
            };
        });

        this.meshNpcs = [];
        this.phyNpcs = [];
        this.GhostPhysics.forEach(it => {
            this.phyNpcs.push({
                uuid: it.data.uuid,
                exa: it.example,
                play: it.play
            });
            it.mesh.map(ite => {
                this.meshNpcs.push(ite.mesh);
            });
        });
        this.ray = new CreateRayModel(this, false);
        /**
         * @description set ray floor used for player move
         */
        this.ray.ground(this, [
            ...this.GameWorldScenePhysicsElement.map(item => {
                /**@abstract use Player action area or obstacle area */
                return item.mesh
            })
        ], (name, pos, obj) => {
            if (name === 'Mesh_floor' || name === 'Mesh_floor_1' || name === 'Mesh_floor_2' || name === 'Mesh_floor_3' || name === 'Mesh_floor_4' || name === 'Mesh_floor_5' || name === 'patch-sand' || name === 'patch-001' || name === 'patch-sand002' || name === 'patch-grass' || name === 'patch-grass001' || name === 'patch-grass002') {
                // this.CreateInterstellarCoordinates.lightPyramidArr[0].position.set(pos.x, -28, pos.z);
                this.PlayerMoveCursor.position.set(pos.x, -.8, pos.z);
                if (this.PlayerMove) {
                    this.PlayerMove = null;
                    this.progress = PROGRESS;
                    this.velocity = CONSTANT_VELOCITY;
                };
                this.PlayerMove = new CreateNavigationPath(this, this.GroundNavMesh, this.PlayerPhysics.position, pos);
                this.watchOpenPlayerMove.value = true;

                /**@abstract Multiplayer online */
                socket.emit('playersImageData', {
                    type: 'move',
                    body: {
                        players: this.PlayerPhysics.position,
                        ground: pos
                    }
                });
            };
        });

        /**
         * @description set ray ghost used for attacking ghosts
         */
        this.ray.npcs(this, this.meshNpcs, (name, pos, obj) => {
            if (name === 'torso') {
                if (!GO_INTO_ACTION) {
                    this.ghostPos = pos;
                    if (CreateCombatSystem.markGhost(this, obj.uuid) === null) {
                        CreateExecuteSceneImage.main(this);
                    };
                };
            };
        });

        /**
         * @description set ray brain pick up items
         */
        this.ray.brain(this, this.brainItems, (name, pos, obj) => {
            if (name === "pariet_01_-_Default_0") {
                this.BrainItems = this.brainItems.find(item => item.uuid === obj.uuid);
                this.BrainIndex = this.brainItems.indexOf(this.BrainItems);

                socket.emit('SceneGameEquipmentPicking', {
                    type: 'EP',
                    body: this.BrainItems.uuid
                });
            };
        });

        /**@deprecated set ray chestEqu pick up items */
        this.ray.chestEqu(this, this.chestEquItems, (name, pos, obj) => {
            this.ChestEquItems = this.chestEquItems.find(item => item.uuid === obj.uuid);
            this.ChestEquIndex = this.chestEquItems.indexOf(this.ChestEquItems);

            socket.emit('SceneGameEquipmentPicking', {
                type: 'THEP',
                body: this.ChestEquItems.uuid
            });
        });

        /**
         * @description set ray brains used for open AI
         */
        this.ray.brains(this, (name, pos, obj) => {
            if (this.openAISys) {
                HtmlSubscription.publish('AI');
                socket.emit('SceneGameZombieChat', {
                    type: 'talk',
                    body: 'Copywriting-three'
                });
            };
        });

        /**
         * @description set ray chest used for open Treasure Hunt game
         */
        this.ray.chest(this, (name, pos, obj) => {
            if (this.openTHGameChest) {
                const data = {
                    player_uuid: this.PlayerPhysicsData.playerDataType.id,
                    type: ''
                };
                HtmlSubscription.publish('get_chest_treasure', data);
            };
        });

        /**
         * @description set ray digger used for open Treasure Hunt game
         */
        this.ray.treasureHunt(this, (name, pos, obj) => {
            if (this.openTHGameSys) {
                HtmlSubscription.publish('THGame');
            };
        });

        CreateCombatSystem.listenToGhost.call(this, this.phyNpcs);

        CreateListenPhysicsGameWorldBiology.listenPlayer.call(this);

        CreateListenPhysicsGameWorldBiology.listenPumpkinWeapon.call(this);

        CreateListenPhysicsGameWorldBiology.listenGhost.call(this);

        const AI = new CreateAIModelSystem();
        AI.listenOpenAISystem.call(this);

        const THGAME = new CreateTHGameSystem();
        THGAME.listenOpenTHGameSystem.call(this);

        this.GhostATKPlayer = new CreateGhostATKPlayer();
        this.GhostATKPlayer.listenGhostPlayerInteractive.call(this);

        HtmlSubscription.publish("l_dom", false);

        HtmlSubscription.subscribe('killGhostEDWeight_done', async data => {
            this.BrainPhysics = await this.biology.brain(data);
            delete CreateEquipmentDropSystem.instance;
        });

        HtmlSubscription.subscribe('skill_Q_done', num => {
            delete CreateSkillQ.instance;
        });

        HtmlSubscription.subscribe('ghost_refresh_task_done', () => {
            this.io.openZombieCoordinatesScheduledTasks();
        });

        HtmlSubscription.subscribe('player_plan_save_game', () => {
            this.PlayerPhysicsData.coordinate.x = this.PlayerPhysics.position.x;
            this.PlayerPhysicsData.coordinate.z = this.PlayerPhysics.position.z;
            HtmlSubscription.publish("that_player_data", this.PlayerPhysicsData);
        });

        HtmlSubscription.subscribe('player_plan_voer_game', async () => {
            await this.io.off();
            window.location.reload();
        });

        HtmlSubscription.subscribe('game_2d_scene_get_ball', () => {
            socket.emit('SceneGame2DGetBall', 'GB');
        });

        HtmlSubscription.subscribe('game_2d_scene_count_ball', str => {
            socket.emit('SceneGame2DCountBall', {
                type: 'RP',
                body: str
            });
        });

        HtmlSubscription.subscribe('closeFight', () => {
            this.playerDisengagement();
        });

        HtmlSubscription.subscribe('eat_brain_chat', () => {
            socket.emit('SceneGameZombieChat', {
                type: 'talk',
                body: 'Copywriting-four'
            });
        });

        HtmlSubscription.subscribe('decision_making', obj => {

            if (obj.key === 'crazyBehaviorMode') {

                if (GPBD_POLLER) GPBD_POLLER.stop();

                const modules = obj.fd;
                const timer = modules[0].timer;
                GHOST_ATK_TIMER = modules[0].atkTimer;
                CONSTANT_VELOCITY_GHOST = modules[0].speed ? modules[0].speed : CONSTANT_VELOCITY_GHOST;

                GPBD_POLLER = GhostPollingBehaviorDecision(modules, timer, module => {
                    // console.log('Current module:', module);

                    if (this.GhostMove) {
                        this.GhostMove = null;
                        this.progress_ghost = PROGRESS_GHOST;
                        this.velocity_ghost = CONSTANT_VELOCITY_GHOST;
                    };

                    this.GhostMove = new CreateNavigationPath(this, this.GroundNavMesh, this.GhostPhysicsItem.position, { x: this.PlayerPhysics.position.x, y: -0.9, z: this.PlayerPhysics.position.z });
                    this.OpenGhostMove = true;
                    this.bloodBarMove = this.bloodBar;
                    this.watchOpenGhostMove.value = true;

                });

                return;
            };

            if (GPBD_KEY === obj.key) return console.log('Repeat key.');
            GPBD_KEY = obj.key;

            if (GPBD_POLLER) GPBD_POLLER.stop();

            const modules = obj.fd;
            const timer = modules[0].timer;
            CONSTANT_VELOCITY_GHOST = modules[0].speed ? modules[0].speed : CONSTANT_VELOCITY_GHOST;
            // console.log('CONSTANT_VELOCITY_GHOST:', CONSTANT_VELOCITY_GHOST);

            GPBD_POLLER = GhostPollingBehaviorDecision(modules, timer, module => {
                // console.log('Current module:', module);

                if (this.GhostMove) {
                    this.GhostMove = null;
                    this.progress_ghost = PROGRESS_GHOST;
                    this.velocity_ghost = CONSTANT_VELOCITY_GHOST;
                };

                this.GhostMove = new CreateNavigationPath(this, this.GroundNavMesh, this.GhostPhysicsItem.position, { x: module.position.x, y: -0.9, z: module.position.z });
                this.OpenGhostMove = true;
                this.bloodBarMove = this.bloodBar;
                this.watchOpenGhostMove.value = true;

            });
        });

        HtmlSubscription.subscribe('start_th', () => {
            socket.emit('privateSceneGameTreasureHunt', 'TH');
        });

        HtmlSubscription.subscribe('get_th_count_down', () => {
            socket.emit('privateSceneGameTreasureHunt', 'TIMER');
        });

        HtmlSubscription.subscribe('del_th', () => {
            socket.emit('privateSceneGameTreasureHunt', 'DEL');
        });

        HtmlSubscription.subscribe('openChest', map => {
            this.biology.chestEquipment(map);
            this.PhysicsChest.position.set(0, 30, 0);
        });

        HtmlSubscription.subscribe('onZoomLevel', val => {
            this.SceneZoomLevel = val;
            this.OpenSceneZoomLevel = true;
        });


        HtmlSubscription.publish('ep-count', this.PlayerPhysicsData.playerDataType.brainCount);

        HtmlSubscription.publish('kg-count', this.PlayerPhysicsData.playerDataType.ghostCount);

        HtmlSubscription.subscribe('playerUseWear', name => {
            switch (name) {
                case 'lantern':
                    CreatePlayerHandWeapon.initPlayerWearModel.call(this, 'Lantern', 'right');
                    break;
            };
        });

        HtmlSubscription.subscribe('enchant', () => {
            CreateEnchant.particles.call(this);
        });

        /**@description Multiplayer online */
        HtmlSubscription.subscribe('joinMultiplayerOnline', () => {
            CreatePlayerHandWeapon.initPlayerWearModel.call(this, 'Gun', 'left');

            socket.emit('JoinMOSceneGameRoom', { 'type': 'join' });
            socket.emit('playersImageData', {
                type: 'init',
                body: {
                    players: this.PlayerPhysics.position
                }
            });
        });

        /**@description Multiplayer online */
        HtmlSubscription.subscribe('leaveMORoom', () => {
            socket.emit('leaveMOSceneGameRoom', { 'type': 'leave' });
            this.moio.delAllPlayersImage.call(this);

            CreatePlayerHandWeapon.removeWear.call(this, 'MESH_GUN', 'PlayerPhysicsLeftHand');
        });

        /**@description Multiplayer online */
        HtmlSubscription.subscribe('playerChatMsg', message => {
            socket.emit('playerChatMsg', { type: 'PMSG', body: message });
        });

        /**@description Multiplayer online */
        socket.on('MOPlayerChatMsg', obj => {
            HtmlSubscription.publish("chat", obj);
        });

    };

    update(time) {

        if (this.grass) {
            this.grass.update(time);
        };

        if (this.orbitControls) {
            this.orbitControls.update();
        };

        if (this.OpenPlayerMove) {
            // console.log(this.PlayerPhysics.position);
            this.PlayerBloodBar.position.set(this.PlayerPhysics.position.x, .2, this.PlayerPhysics.position.z);
            this.PlayerMove.init(this, this.PlayerPhysics, { progress: 'progress', velocity: 'velocity', whoMove: 'PlayerMove', whoWatchOpen: 'watchOpenPlayerMove' }, 0);
            this.PlayerPhysics.body.needUpdate = true;
        };

        if (this.OpenPumpkinWeaponMove) {
            this.pumpkinWeaponMove.init(this, this.PhysicsPumpkin, { progress: 'progress_pumpkin', velocity: 'velocity_pumpkin', whoMove: 'pumpkinWeaponMove', whoWatchOpen: 'watchOpenPumpkinWeaponMove' }, 1);
        };

        if (this.OpenGhostMove) {
            this.bloodBarMove.position.set(this.GhostPhysicsItem.position.x, this.bloodBarMove.position.y, this.GhostPhysicsItem.position.z);
            this.GhostMove.init(this, this.GhostPhysicsItem, { progress: 'progress_ghost', velocity: 'velocity_ghost', whoMove: 'GhostMove', whoWatchOpen: 'watchOpenGhostMove' }, 2);
            this.GhostPhysicsItem.body.needUpdate = true;
        };

        if (this.OpenCreateInterstellarCoordinates) {
            this.CreateInterstellarCoordinates.anima();
        };

        if (this.OpenStartGameLookScene) {
            const { x, y, z } = this.third.camera.position;
            if (x <= 8 && y <= 10 && z <= 13) return this.OpenStartGameLookScene = false;
            this.third.camera.position.lerp(
                new THREE.Vector3(7, 1, 12),
                0.01
            );
        };

        if (this.OpenSceneZoomLevel) {
            const { x, y, z } = this.third.camera.position;
            if (this.SceneZoomLevel === 'far') {
                if (y >= 9) return this.OpenSceneZoomLevel = false;
                this.third.camera.position.lerp(
                    new THREE.Vector3(7, 10, 12),
                    0.08
                );
            };

            if (this.SceneZoomLevel === 'near') {
                if (y <= 6) return this.OpenSceneZoomLevel = false;
                this.third.camera.position.lerp(
                    new THREE.Vector3(7, -10, 12),
                    0.01
                );
            };
        };

        if (this.openPlayerFindNPCQuestion && this.PlayerPhysics) {
            this.findNPCImgQuestion.position.set(this.PlayerPhysics.position.x, 1.2, this.PlayerPhysics.position.z);
        };

        if (this.openPlayerFindGhostMark && this.GhostMarkPhysics.exa) {
            this.findNPCImgMark.position.set(this.GhostMarkPhysics.exa.position.x, this.GhostMarkPhysics.exa.position.y + .5, this.GhostMarkPhysics.exa.position.z);
        };

        if (this.openPlayerAR && this.playerCircle && this.PlayerPhysics) {
            this.playerCircle.position.set(this.PlayerPhysics.position.x, this.PlayerPhysics.position.y + .4, this.PlayerPhysics.position.z);
            this.playerCircle.body.needUpdate = true;
        };

        if (this.openPlayerARForWA && this.playerCircleWA && this.PlayerPhysics) {
            this.playerCircleWA.position.set(this.PlayerPhysics.position.x, this.PlayerPhysics.position.y + .4, this.PlayerPhysics.position.z);
            this.playerCircleWA.body.needUpdate = true;
        };

        if (this.openPumpkinWeaponAR && this.pumpkinWeaponCircle && this.PhysicsPumpkin) {
            this.pumpkinWeaponCircle.position.set(this.PhysicsPumpkin.position.x, this.PhysicsPumpkin.position.y, this.PhysicsPumpkin.position.z);
            this.pumpkinWeaponCircle.body.needUpdate = true;
        };

        if (this.PhysicsBrains && this.PlayerPhysics) {
            this.PhysicsBrains.lookAt(this.PlayerPhysics.position);
        };

        if (this.PhysicsDigger && this.PlayerPhysics) {
            this.PhysicsDigger.lookAt(this.PlayerPhysics.position);
        };

        if (this.OpenPlayerNameTextSpriteMove) {
            this.playerNameTextSprite.position.set(this.PlayerPhysics.position.x, .5, this.PlayerPhysics.position.z);
        };

        if (this.arrowHelper && this.OpenRayDebug) {
            this.arrowHelper.position.copy(this.raycaster.ray.origin);
            this.arrowHelper.setDirection(this.raycaster.ray.direction);
            this.arrowHelper.setLength(50, 0.2, 0.1);
        };

        if (this.fireParticlesModel) {
            CreateEnchant.animateFire();
            this.fireParticlesModel.position.set(this.PlayerPhysics.position.x, this.PlayerPhysics.position.y, this.PlayerPhysics.position.z);
        };

        if (this.openPointLantern) {
            this.point_lantern.position.set(this.PlayerPhysics.position.x, this.PlayerPhysics.position.y + 0.6, this.PlayerPhysics.position.z);
        };

        /**@abstract Multiplayer online */
        if (this.openPlayersImage) {
            this.playersAllImage.forEach(players => {
                if (players.isMove) {
                    players.playersMove.imageInit(this, players)
                };
                if (players.nameISMove) {
                    players.playerNameTextSprite.position.set(players.position.x, .5, players.position.z);
                };
            });
        };

    };

    playerDisengagement() {

        this.resetGhostGehavioralDecisionMaking();

        CreateBiologyActAnima.ghostStop.call(this);
        this.OpenGhostMove = false;
        this.openPlayerFindGhostMark = false;
        this.findNPCImgMark.position.set(0, 30, 0);

        GO_INTO_ACTION = false;
        HtmlSubscription.publish('fight', false);

        /** Ghost clear ATK timer */
        ATTACK_LOCK_GHOST_UUID = '';
        clearInterval(GHOST_ATK_PLAYER_TIMER);

        delete CreateSceneTextMessage.instance;

    };

    /** HEADE */
    getPointer() {
        /** calculate mouse position in normalized device coordinates */
        // (-1 to +1) for both components
        const pointer = this.input.activePointer;
        const x = (pointer.x / this.cameras.main.width) * 2 - 1;
        const y = -(pointer.y / this.cameras.main.height) * 2 + 1;
        return { x, y };
    };
    /** TAIL */

    cameraLookSandTable() {
        this.third.camera.position.set(10, 42, 56);
        this.third.camera.lookAt(0, 0, 0);
    };

    watch(initialValue, callback) {
        let value = initialValue;
        return {
            get value() {
                return value;
            },
            set value(newValue) {
                const oldValue = value;
                value = newValue;
                callback(oldValue, newValue);
            }
        };
    };

    cleanupResources() {

        if (this.GhostPhysics && this.GhostPhysics.length > 0) {
            this.GhostPhysics.forEach(item => {
                this.cleanupObject3D(item.example);
            });
            this.GhostPhysics = [];
        };

        this.NPCBloodBars.forEach(bar => {
            this.third.scene.remove(bar);
            bar.geometry.dispose();
            bar.material.dispose();
        });
        this.NPCBloodBars = [];
    }

    cleanupObject3D(object) {
        if (!object) return;

        if (object.parent) {
            object.parent.remove(object);
        };

        if (object.body) {
            this.third.physics.destroy(object.body);
        };

        if (object.anims && object.anims.mixer) {
            object.anims.mixer.stopAllAction();
            object.anims.mixer.uncacheRoot(object);
            if (object.anims.mixer._actions) {
                object.anims.mixer._actions.forEach(action => {
                    object.anims.mixer.uncacheAction(action);
                });
            };
        };

        object.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    };
                };
            };
        });
    };

    cleanupResourcesItem(uuid) {

        if (this.GhostPhysics && this.GhostPhysics.length > 0) {
            this.GhostPhysics.forEach((item, index) => {
                if (item.example.uuid === uuid) {
                    this.cleanupObject3DItem(item.example);
                    this.GhostPhysics.splice(index, 1);
                    this.phyNpcs.splice(index, 1);
                };
            });
        };

        this.NPCBloodBars.forEach((bar, index) => {
            if (bar.uuid === uuid) {
                this.third.scene.remove(bar);
                bar.geometry.dispose();
                bar.material.dispose();
                this.NPCBloodBars.splice(index, 1);
            };
        });
    };

    cleanupObject3DItem(object) {
        if (!object) return;

        if (object.parent) {
            object.parent.remove(object);
        };

        if (object.body) {
            this.third.physics.destroy(object.body);
        };

        if (object.anims && object.anims.mixer) {
            object.anims.mixer.stopAllAction();
            object.anims.mixer.uncacheRoot(object);
            if (object.anims.mixer._actions) {
                object.anims.mixer._actions.forEach(action => {
                    object.anims.mixer.uncacheAction(action);
                });
            };
        };

        object.traverse(child => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    };
                };
            };
        });
    };

    async killGhostItem(uuid) {

        this.OpenGhostMove = false;

        this.resetGhostGehavioralDecisionMaking();

        this.openPlayerFindGhostMark = false;
        this.findNPCImgMark.position.set(0, 30, 0);

        const item = this.GhostPhysics.find(item => item.data.uuid === uuid);
        await CreateBiologyActAnima.ghostDie(item);
        await CreateBiologyActAnima.ghostDisappear(item);

        this.cleanupResourcesItem(uuid);

        if (this.ray) {
            this.ray.updateNpcObjectsItem(uuid);
        };

        CreateCombatSystem.myLinkedList.removeItem(uuid);

        CreateEquipmentDropSystem.main(uuid);

        socket.emit('SceneGameKillGhostCount', {
            type: 'KG',
            body: uuid
        });

        if (this.GhostPhysics.length === 0 && this.phyNpcs.length === 0) {
            console.log('Ghost clearing the scene!');

            HtmlSubscription.publish("ghost_refresh_task", true);

        };

        GO_INTO_ACTION = false;
        HtmlSubscription.publish('fight', false);

        /** Ghost clear ATK timer */
        ATTACK_LOCK_GHOST_UUID = '';
        clearInterval(GHOST_ATK_PLAYER_TIMER);

        delete CreateSceneTextMessage.instance;

    };

    async resetSceneGhostSystem() {

        this.OpenGhostMove = false;

        this.resetGhostGehavioralDecisionMaking();

        this.cleanupResources();

        this.openPlayerFindGhostMark = false;
        this.findNPCImgMark.position.set(0, 30, 0);

        this.GhostPhysics = await this.biology.npc();

        this.meshNpcs = [];
        this.phyNpcs = [];
        this.GhostPhysics.forEach(it => {
            this.phyNpcs.push({
                uuid: it.data.uuid,
                exa: it.example,
                play: it.play
            });
            it.mesh.map(ite => {
                this.meshNpcs.push(ite.mesh);
            });
        });
        if (this.ray) {
            this.ray.updateNpcObjects(this.meshNpcs);
        };

        CreateCombatSystem.listenToGhost.call(this, this.phyNpcs);
        this.GhostATKPlayer.listenGhostPlayerInteractive.call(this);

        HtmlSubscription.publish("ghost_refresh_task", false);

        GO_INTO_ACTION = false;
        HtmlSubscription.publish('fight', false);

        /** Ghost clear ATK timer */
        ATTACK_LOCK_GHOST_UUID = '';
        clearInterval(GHOST_ATK_PLAYER_TIMER);

        delete CreateSceneTextMessage.instance;

    };

    async resetGhostGehavioralDecisionMaking() {
        if (GPBD_POLLER) GPBD_POLLER.stop();
        CONSTANT_VELOCITY_GHOST = 1;
        GPBD_KEY = '';
    };

};
