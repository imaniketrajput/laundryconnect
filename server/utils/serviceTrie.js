const Trie = require("./Trie");
const Service = require("../models/Service");

const serviceTrie = new Trie();

const buildTrieFromDB = async () =>{
    const services = await Service.find();
    services.forEach((service)=>{
        serviceTrie.insert(service.name, service._id);
    });
    console.log(`Trie built with ${services.length} services`);
}

module.exports = {serviceTrie, buildTrieFromDB};
