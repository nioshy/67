import{Maze}from"./maze.js";import{Renderer}from"./renderer.js";import{Player}from"./player.js";import{Enemy}from"./enemy.js";import{Achievements}from"./achievements.js";
const $=id=>document.getElementById(id),canvas=$("game"),timer=$("timer"),stars=$("stars-display"),overlay=$("overlay"),title=$("message-title"),message=$("message-text"),starMessage=$("star-message"),unlockMessage=$("unlock-message"),restart=$("restart-button"),galleryButton=$("gallery-button"),gallery=$("gallery-screen"),closeGallery=$("close-gallery-button"),galleryProgress=$("gallery-progress"),galleryStars=$("gallery-stars"),galleryGrid=$("gallery-grid"),viewer=$("photo-viewer"),closePhoto=$("close-photo-button"),largePhoto=$("large-photo"),largeTitle=$("large-photo-title"),largeCaption=$("large-photo-caption");
const renderer=new Renderer(canvas),maze=new Maze(21,13),achievements=new Achievements();const game={maze,exit:null,player:new Player(1,1),enemy:new Enemy(19,11),state:"playing",startTime:0,elapsedTime:0};let previous=performance.now();
function resetEntity(e,x,y){e.x=e.targetX=x;e.y=e.targetY=y;e.moving=false;}function updateStars(){stars.textContent=`⭐ ${achievements.totalStars}`;}
function generateLevel(){maze.generate();game.exit=maze.findFurthest(1,1);resetEntity(game.player,1,1);resetEntity(game.enemy,game.exit.x,game.exit.y);game.state="playing";game.startTime=performance.now();game.elapsedTime=0;timer.textContent="Time: 0.0";starMessage.classList.add("hidden");unlockMessage.classList.add("hidden");overlay.classList.add("hidden");renderer.stopDefeatAnimation();renderer.cameraX=canvas.width/2;renderer.cameraY=canvas.height/2;}
function showResult(t,text,caught=false){game.state="finished";title.textContent=t;message.textContent=text;if(caught){renderer.triggerShake(22,1.4);renderer.startDefeatAnimation();setTimeout(()=>{renderer.stopDefeatAnimation();overlay.classList.remove("hidden");},1500);return;}overlay.classList.remove("hidden");}
function win(){const reward=achievements.awardStars(game.elapsedTime);updateStars();starMessage.textContent=`You earned ${reward.earnedStars} ${reward.earnedStars===1?"star":"stars"}!`;starMessage.classList.remove("hidden");if(reward.newPhotos.length){unlockMessage.textContent=`New memory unlocked: ${reward.newPhotos.map(x=>x.title).join(", ")}!`;unlockMessage.classList.remove("hidden");}else{const n=achievements.getStarsNeededForNextPhoto();if(n){unlockMessage.textContent=`${n} more ${n===1?"star":"stars"} until the next memory.`;unlockMessage.classList.remove("hidden");}}showResult("You Escaped!",`Escape time: ${game.elapsedTime.toFixed(1)} seconds.`);}
function update(dt){if(game.state!=="playing")return;game.elapsedTime=(performance.now()-game.startTime)/1000;timer.textContent=`Time: ${game.elapsedTime.toFixed(1)}`;game.player.update(dt);game.enemy.update(dt,maze,game.player);if(Math.hypot(game.player.x-game.enemy.x,game.player.y-game.enemy.y)<.55)showResult("Caught!","The toilet caught the 67 Kid.",true);else if(Math.hypot(game.player.x-game.exit.x,game.player.y-game.exit.y)<.25)win();}
function loop(now){const dt=Math.min((now-previous)/1000,.05);previous=now;update(dt);renderer.render(game);requestAnimationFrame(loop);}function move(dir){if(game.state!=="playing")return;const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[dir];if(d)game.player.move(d[0],d[1],maze);}
addEventListener("keydown",e=>{const k=e.key.toLowerCase(),map={arrowup:"up",w:"up",arrowdown:"down",s:"down",arrowleft:"left",a:"left",arrowright:"right",d:"right"};if(map[k]){e.preventDefault();move(map[k]);}if(k==="r")generateLevel();if(k==="escape"){viewer.classList.add("hidden");gallery.classList.add("hidden");}});document.querySelectorAll("[data-move]").forEach(b=>b.addEventListener("pointerdown",e=>{e.preventDefault();move(b.dataset.move);}));restart.onclick=generateLevel;
function renderGallery(){galleryGrid.innerHTML="";galleryProgress.textContent=`${achievements.unlockedCount} of ${achievements.photos.length} unlocked — ${achievements.getRemainingCount()} remaining`;galleryStars.textContent=achievements.unlockedCount>=achievements.photos.length?`⭐ ${achievements.totalStars} — All memories unlocked!`:`⭐ ${achievements.totalStars} — ${achievements.getStarsTowardNextPhoto()} of ${achievements.starsPerPhoto} stars toward the next memory`;achievements.photos.forEach((photo,i)=>{const card=document.createElement("article");card.className="gallery-card";if(achievements.isUnlocked(i)){const img=document.createElement("img");img.src=photo.file;img.alt=photo.title;img.onerror=()=>{img.style.display="none";};const h=document.createElement("h3");h.textContent=photo.title;card.append(img,h);card.onclick=()=>{largePhoto.src=photo.file;largeTitle.textContent=photo.title;largeCaption.textContent=photo.caption;viewer.classList.remove("hidden");};}else{card.classList.add("locked");const p=document.createElement("div");p.className="locked-placeholder";p.textContent=`Memory ${i+1}`;const h=document.createElement("h3");h.textContent="Locked";card.append(p,h);}galleryGrid.append(card);});}
galleryButton.onclick=()=>{renderGallery();gallery.classList.remove("hidden");};closeGallery.onclick=()=>gallery.classList.add("hidden");closePhoto.onclick=()=>viewer.classList.add("hidden");viewer.onclick=e=>{if(e.target===viewer)viewer.classList.add("hidden");};updateStars();generateLevel();requestAnimationFrame(loop);
const touchControls = document.querySelector(".touch-controls");

if (touchControls) {
    touchControls.addEventListener(
        "touchstart",
        event => {
            event.preventDefault();
        },
        { passive: false }
    );

    touchControls.addEventListener(
        "touchmove",
        event => {
            event.preventDefault();
        },
        { passive: false }
    );

    touchControls.addEventListener("dblclick", event => {
        event.preventDefault();
    });
const touchButtons = document.querySelectorAll(".touch-controls button");

touchButtons.forEach(button => {
    button.addEventListener(
        "pointerdown",
        event => {
            event.preventDefault();
            event.stopPropagation();

            const direction = button.dataset.dir;

            if (direction === "up") {
                handleMove(0, -1);
            }

            if (direction === "down") {
                handleMove(0, 1);
            }

            if (direction === "left") {
                handleMove(-1, 0);
            }

            if (direction === "right") {
                handleMove(1, 0);
            }
        }
    );
});
}
