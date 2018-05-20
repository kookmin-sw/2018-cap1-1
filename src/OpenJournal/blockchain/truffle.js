// Rinkeby에 Truffle contract deploy하기
module.exports = {
    networks: {
      development: {
        host: "localhost",
        port: 7545,
        network_id: "*" // Match any network id
      },
       rinkeby: {
		host: "localhost",
		port: 8545,
		network_id: "4",
		from: "0xE7b358568Ee9A92264186AE4580D4647e877afBA",
		gas: 4699999
    }
  }
};
