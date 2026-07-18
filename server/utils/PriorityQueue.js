class PriorityQueue{
    constructor(){
        this.heap = [];
    }

    size(){
        return this.heap.length;
    }

    isEmpty(){
        return this.heap.length === 0;
    }

    getParentIndex(i){
        return Math.floor((i-1)/2);
    }

    getLeftChildIndex(i){
        return 2 * i + 1;
    }

    getRightChildIndex(i){
        return 2 * i + 2;
    }

    swap(i, j){
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }

    insert(order, priority)
    {
        this.heap.push({order, priority});
        this.bubbleUp(this.heap.length-1);
    }

    bubbleUp(index){
        while(index>0)
        {
            const parentIndex = this.getParentIndex(index);
            if(this.heap[parentIndex].priority >= this.heap[index].priority) break;
            this.swap(parentIndex, index);
            index = parentIndex;

        }
    }

    extractMax(){
        const max = this.heap[0];
        const last = this.heap.pop();

        if(this.heap.length > 0){
            this.heap[0] = last;
            this.bubbleDown(0);
        }

        return max;
    }

    bubbleDown(index){
        const length = this.heap.length;

        while(true){
            const left = this.getLeftChildIndex(index);
            const right = this.getRightChildIndex(index);
            let largest = index;

            if(left < length && this.heap[left].priority > this.heap[largest].priority){
                largest = left;
            }

            if(right < length && this.heap[right].priority > this.heap[largest].priority){
                largest = right;
            }

            if(largest === index) break;

            this.swap(index, largest);
            index = largest;
        }
    }
    peekAllSorted(){
        const clone = new PriorityQueue();
        clone.heap = [...this.heap];
        const result = [];
        while(!clone.isEmpty())
        {
            result.push(clone.extractMax());
        }

        return result;
    }
}

module.exports = PriorityQueue;