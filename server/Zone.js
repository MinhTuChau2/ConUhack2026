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
        this.targetCenterX=0;
        this.targetCenterY=0;
        this.shrinkSpeed=10;
        this.isActive=false;
        this.damagePerSecond=5;
    }

    initialize(mapWidth,mapHeight){
        this.centerX = mapWidth / 2;
        this.centerY = mapHeight / 2;
        this.initialWidth = mapWidth;   
        this.initialHeight = mapHeight;   
        this.currentWidth = this.initialWidth;
        this.currentHeight = this.initialHeight;
        this.targetWidth = 200;  
        this.targetHeight = 200;
        
        const halfTargetWidth = this.targetWidth / 2;
        const halfTargetHeight = this.targetHeight / 2;
        
        this.targetCenterX = halfTargetWidth + Math.random() * (mapWidth - this.targetWidth);
        this.targetCenterY = halfTargetHeight + Math.random() * (mapHeight - this.targetHeight);
        
        this.isActive = true;
    }

    update(deltaTime){
        if(!this.isActive) return;

        if(this.currentWidth > this.targetWidth){
            this.currentWidth -= this.shrinkSpeed * deltaTime;
        }
        if(this.currentHeight > this.targetHeight){
            this.currentHeight -= this.shrinkSpeed * deltaTime;
        }

        if(this.currentWidth <= this.targetWidth){
            this.currentWidth = this.targetWidth;
        }
        if(this.currentHeight <= this.targetHeight){
            this.currentHeight = this.targetHeight;
        }
        
        const centerMoveSpeed = this.shrinkSpeed * 0.5; 
        
        if(Math.abs(this.centerX - this.targetCenterX) > 1){
            if(this.centerX < this.targetCenterX){
                this.centerX += centerMoveSpeed * deltaTime;
                if(this.centerX > this.targetCenterX) this.centerX = this.targetCenterX;
            } else {
                this.centerX -= centerMoveSpeed * deltaTime;
                if(this.centerX < this.targetCenterX) this.centerX = this.targetCenterX;
            }
        }
        
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

    checkPlayerInZone(playerX, playerY){
        const left = this.centerX - this.currentWidth / 2;
        const right = this.centerX + this.currentWidth / 2;
        const top = this.centerY - this.currentHeight / 2;
        const bottom = this.centerY + this.currentHeight / 2;
        
        return (playerX >= left && playerX <= right && 
                playerY >= top && playerY <= bottom);
    }

    isPlayerTakingDamage(playerX, playerY){
        return(this.isActive && !this.checkPlayerInZone(playerX, playerY));
    }
}