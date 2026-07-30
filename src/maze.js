// src/maze.js

export class Maze {

    constructor(width, height) {

        this.width = width | 1;
        this.height = height | 1;

        this.grid = [];

    }

    generate() {

        this.grid = Array.from(
            { length: this.height },
            () => Array(this.width).fill(1)
        );

        this.#carve(1,1);

        this.#addLoops(8);

        return this.grid;

    }

    #carve(x,y){

        this.grid[y][x]=0;

        const dirs=[
            [2,0],
            [-2,0],
            [0,2],
            [0,-2]
        ];

        dirs.sort(()=>Math.random()-0.5);

        for(const [dx,dy] of dirs){

            const nx=x+dx;
            const ny=y+dy;

            if(
                nx<1||
                ny<1||
                nx>=this.width-1||
                ny>=this.height-1
            ) continue;

            if(this.grid[ny][nx]===0)
                continue;

            this.grid[y+dy/2][x+dx/2]=0;

            this.#carve(nx,ny);

        }

    }

    #addLoops(count){

        let added=0;

        while(added<count){

            const x=1+Math.floor(Math.random()*(this.width-2));
            const y=1+Math.floor(Math.random()*(this.height-2));

            if(this.grid[y][x]===0)
                continue;

            const horizontal=
                this.grid[y][x-1]===0 &&
                this.grid[y][x+1]===0;

            const vertical=
                this.grid[y-1][x]===0 &&
                this.grid[y+1][x]===0;

            if(horizontal||vertical){

                this.grid[y][x]=0;

                added++;

            }

        }

    }

    isWall(x,y){

        return this.grid[y][x]===1;

    }

    isFloor(x,y){

        return this.grid[y][x]===0;

    }

    findFurthest(startX,startY){

        const queue=[
            {
                x:startX,
                y:startY,
                d:0
            }
        ];

        const visited=new Set([
            `${startX},${startY}`
        ]);

        let furthest=queue[0];

        while(queue.length){

            const current=queue.shift();

            if(current.d>furthest.d)
                furthest=current;

            const dirs=[
                [1,0],
                [-1,0],
                [0,1],
                [0,-1]
            ];

            for(const [dx,dy] of dirs){

                const nx=current.x+dx;
                const ny=current.y+dy;

                const key=`${nx},${ny}`;

                if(
                    nx<0||
                    ny<0||
                    nx>=this.width||
                    ny>=this.height
                ) continue;

                if(!this.isFloor(nx,ny))
                    continue;

                if(visited.has(key))
                    continue;

                visited.add(key);

                queue.push({
                    x:nx,
                    y:ny,
                    d:current.d+1
                });

            }

        }

        return furthest;

    }

}