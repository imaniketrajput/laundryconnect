class TrieNode{
    constructor(){
        this.children = {};
        this.isEndOfWord = false;
        this.serviceIds = new Set();
    }
}

class Trie{
    constructor() {
        this.root = new TrieNode;
    }


    insert(word, serviceId){
        let node = this.root;
        const lowerWord = word.toLowerCase();

        for(const char of lowerWord){
            if(!node.children[char]){
                node.children[char] = new TrieNode();
            }

            node = node.children[char];
            node.serviceIds.add(serviceId.toString());
        }
        node.isEndOfWord = true;
    }

    search(prefix){
        let node = this.root;
        const lowerPrefix = prefix.toLowerCase();

        for(const char of lowerPrefix){
            if(!node.children[char]){
                return [];
            }
            node = node.children[char];
        }

        return Array.from(node.serviceIds);
    }

}

module.exports = Trie;