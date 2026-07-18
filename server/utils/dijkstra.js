class MinPriorityQueue{
    constructor(){
        this.items = [];
    }

    enqueue(node, priority){
        this.items.push({node, priority});
        this.items.sort((a,b)=> a.priority - b.priority);
    }

    dequeue(){
        return this.items.shift();
    }

    isEmpty(){
        return this.items.length === 0;
    }
}

const dijkstra = (graph, source) =>{
    const distances = {};
    const previous = {};
    const pq = new MinPriorityQueue();

    for(const node in graph){
        distances[node] = Infinity;
        previous[node] = null;
    }

    distances[source] = 0;
    pq.enqueue(source, 0);

    while(!pq.isEmpty()){
        const {node: current } = pq.dequeue();

        if(!graph[current]) continue;

        for(const neighbor of graph[current]){
            const newDist = distances[current] + neighbor.weight;

            if(newDist < distances[neighbor.node])
            {
                distances[neighbor.node] = newDist;
                previous[neighbor.node] = current;
                pq.enqueue(neighbor.node, newDist);
            }
        }
    }

    return {distances, previous};
};


const getPath = (previous, target) =>{
    const path = [];
    let current = target;

    while(current != null){
        path.unshift(current);
        current = previous[current];
    }

    return path;
}

module.exports = {dijkstra, getPath};