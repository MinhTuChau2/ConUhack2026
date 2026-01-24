export class Zone {
   
    constructor(){
        this.centerX=0;
        this.centerY=0;
        this.initialWidth=1920;
        this.initialHeight=1080;
        this.currentWidth=1920;
        this.currentHeight=1080;
        this.targetWidth=0;
        this.targetHeight=0;
        this.targetCenterX=0; // random target center X
        this.targetCenterY=0; // random target center Y
        this.shrinkSpeed=10; //shrink speed can be changed
        this.isActive=false;
        this.damagePerSecond=5;

        
    }

    //sets initial zone dimensions using world width and height
    initialize(mapWidth,mapHeight){

        // Center the zone in the middle of the world
        this.centerX = mapWidth / 2;
        this.centerY = mapHeight / 2;
        this.initialWidth = mapWidth;   
        this.initialHeight = mapHeight;   
        this.currentWidth = this.initialWidth;
        this.currentHeight = this.initialHeight;
        this.targetWidth = 200;  
        this.targetHeight = 200;
        
        // Set random target center within world bounds
        const halfTargetWidth = this.targetWidth / 2;
        const halfTargetHeight = this.targetHeight / 2;
        
        this.targetCenterX = halfTargetWidth + Math.random() * (mapWidth - this.targetWidth);
        this.targetCenterY = halfTargetHeight + Math.random() * (mapHeight - this.targetHeight);
        
        this.isActive = true;
    }

    // Update loop for zone shrinking 
    update(deltaTime){

        if(!this.isActive)
            return;

        //shrink zone towards target dimensions based on FPS delta time
        if(this.currentWidth > this.targetWidth){
            this.currentWidth -= this.shrinkSpeed * deltaTime;
        }
        if(this.currentHeight > this.targetHeight){
            this.currentHeight -= this.shrinkSpeed * deltaTime;
        }

        //stops at target dimensions
        if(this.currentWidth <= this.targetWidth){
            this.currentWidth = this.targetWidth;
        }
        if(this.currentHeight <= this.targetHeight){
            this.currentHeight = this.targetHeight;
        }
        
        // Move center toward random target location while shrinking occurs
        const centerMoveSpeed = this.shrinkSpeed * 0.5; 
        
        // Move X toward target
        if(Math.abs(this.centerX - this.targetCenterX) > 1){
            if(this.centerX < this.targetCenterX){
                this.centerX += centerMoveSpeed * deltaTime;
                if(this.centerX > this.targetCenterX) this.centerX = this.targetCenterX;
            } else {
                this.centerX -= centerMoveSpeed * deltaTime;
                if(this.centerX < this.targetCenterX) this.centerX = this.targetCenterX;
            }
        }
        
        // Move Y toward target
        if(Math.abs(this.centerY - this.targetCenterY) > 1){
            if(this.centerY < this.targetCenterY){
                this.centerY += centerMoveSpeed * deltaTime;
                if(this.centerY > this.targetCenterY) this.centerY = this.targetCenterY;
            } else {
                this.centerY -= centerMoveSpeed * deltaTime;
                if(this.centerY < this.targetCenterY) this.centerY = this.targetCenterY;
            }
        }
    }

    //returns true if player is inside the rectangular zone 
    checkPlayerInZone(playerX, playerY){
        // Calculate zone boundaries
        const left = this.centerX - this.currentWidth / 2;
        const right = this.centerX + this.currentWidth / 2;
        const top = this.centerY - this.currentHeight / 2;
        const bottom = this.centerY + this.currentHeight / 2;
        
        //return if player is inside all boundaries
        return (playerX >= left && playerX <= right && 
                playerY >= top && playerY <= bottom);
    }

    //Checks if player should be taking damage from zone
    isPlayerTakingDamage(playerX, playerY){
        return(this.isActive && !this.checkPlayerInZone(playerX, playerY));
    }

    //Draws the rectangular zone 
    render(k){
        if(!this.isActive) {
            return;
        }
        
        // Calculate zone position
        const left = this.centerX - this.currentWidth / 2;
        const top = this.centerY - this.currentHeight / 2;
        
        // Remove previous zone visuals to prevent duplicates
        k.destroyAll("zone-visual");
        
        // Draw danger zones outside the safe area
        const dangerColor = k.rgb(128, 0, 128); 
        const worldWidth = this.initialWidth;
        const worldHeight = this.initialHeight;
        const right = left + this.currentWidth;
        const bottom = top + this.currentHeight;
        
        // Top danger zone (from world top to zone top)
        if (top > 0) {
            k.add([
                k.rect(worldWidth, top),
                k.pos(0, 0),
                k.color(dangerColor),
                k.opacity(0.3),
                k.z(999),
                "zone-visual"
            ]);
        }
        
        // Bottom danger zone (from zone bottom to world bottom) 
        if (bottom < worldHeight) {
            k.add([
                k.rect(worldWidth, worldHeight - bottom),
                k.pos(0, bottom),
                k.color(dangerColor),
                k.opacity(0.3),
                k.z(999),
                "zone-visual"
            ]);
        }
        
        // Left danger zone (from world left to zone left)
        if (left > 0) {
            k.add([
                k.rect(left, worldHeight),
                k.pos(0, 0),
                k.color(dangerColor),
                k.opacity(0.3),
                k.z(999),
                "zone-visual"
            ]);
        }
        
        // Right danger zone (from zone right to world right)
        if (right < worldWidth) {
            k.add([
                k.rect(worldWidth - right, worldHeight),
                k.pos(right, 0),
                k.color(dangerColor),
                k.opacity(0.3),
                k.z(999),
                "zone-visual"
            ]);
        }
        
        // Create outline-only zone using individual line segments
        const outlineWidth = 8;
        const color = k.rgb(128, 0, 128);
        
        // Top line
        k.add([
            k.rect(this.currentWidth, outlineWidth),
            k.pos(left, top),
            k.color(color),
            k.opacity(0.3),
            k.z(1000),
            "zone-visual"
        ]);
        
        // Bottom line  
        k.add([
            k.rect(this.currentWidth, outlineWidth),
            k.pos(left, top + this.currentHeight - outlineWidth),
            k.color(color),
            k.opacity(0.3),
            k.z(1000),
            "zone-visual"
        ]);
        
        // Left line
        k.add([
            k.rect(outlineWidth, this.currentHeight),
            k.pos(left, top),
            k.color(color),
            k.opacity(0.3),
            k.z(1000),
            "zone-visual"
        ]);
        
        // Right line
        k.add([
            k.rect(outlineWidth, this.currentHeight),
            k.pos(left + this.currentWidth - outlineWidth, top),
            k.color(color),
            k.opacity(0.3),
            k.z(1000),
            "zone-visual"
        ]);
    }


    //reset zone to initial state when restarting game or changing scenes
    reset(){
        this.isActive=false;
        this.currentWidth=this.initialWidth;
        this.currentHeight=this.initialHeight;
        this.centerX=0;
        this.centerY=0;
    }
}