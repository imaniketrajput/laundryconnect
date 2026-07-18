const {dijkstra, getPath} = require("./dijkstra");

const haversineDistance = (loc1, loc2) =>{
    const R = 6371;
    const dLat = ((loc2.lat - loc1.lat) * Math.PI) / 180;
    const dLng = ((loc2.lng - loc1.lng) * Math.PI) / 180;

    const a = Math.sin(dLat/2) ** 2 + Math.cos((loc1.lat * Math.PI) / 180) * Math.cos((loc2.lat * Math.PI) / 180) * Math.sin(dLng/2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

const buildGraphFromStops = (stops) =>{
    const graph = {};
    stops.forEach((stop)=>{
        graph[stop.id] = [];
    });

    for(let i=0; i<stops.length; i++)
    {
        for(let j=0; j<stops.length; j++){
            if(i != j){
                const dist = haversineDistance(stops[i], stops[j]);
                graph[stops[i].id].push({node: stops[j].id, weight: dist});
            }
        }
    }

    return graph;
};

const optimizeRoute = (startLocation, stops) =>{
    const allNodes = [{id: "start", lat: startLocation.lat, lng: startLocation.lng}, ...stops];
    const graph = buildGraphFromStops(allNodes);

    const visited = new Set(["start"]);
    const route = [];
    let currentNode = "start";

    while(visited.size < allNodes.length){
        const {distances} = dijkstra(graph, currentNode);

        let nearestNode = null;
        let nearestDist = Infinity;

        for(const node in distances){
            if(!visited.has(node) && distances[node] < nearestDist){
                nearestDist = distances[node];
                nearestNode = node;
            }
        }

        if(nearestNode === null) break;

        route.push({stopId: nearestNode, distanceFromPrevious: nearestDist});
        visited.add(nearestNode);
        currentNode = nearestNode;
    }

    return route;
}


module.exports = {optimizeRoute, haversineDistance};