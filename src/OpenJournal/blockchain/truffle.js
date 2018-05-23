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
		from: "0xa414c2a9bffc4494701883bd168e0ada5fd35cc4",
		gas: 4699999
    }
  }
};
