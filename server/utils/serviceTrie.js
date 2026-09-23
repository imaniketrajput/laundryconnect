const Trie = require("./Trie");
const Service = require("../models/Service");

const serviceTrie = new Trie();

const insertServiceTerms = (name, serviceId) => {
    // Insert full name
    serviceTrie.insert(name, serviceId);

    // Also insert individual words so searching 'iro' matches 'Steam Ironing'
    const words = name.split(/[\s&,-/]+/).filter(w => w.length > 1);
    words.forEach(word => {
        serviceTrie.insert(word, serviceId);
    });
};

const buildTrieFromDB = async () =>{
    const services = await Service.find();
    services.forEach((service)=>{
        insertServiceTerms(service.name, service._id);
    });
    console.log(`Trie built with ${services.length} services`);
};

module.exports = {serviceTrie, buildTrieFromDB, insertServiceTerms};
