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
		from: "0x4afb525688ecc1eaf3d9c9bfdb8bf95654bcf610",
		gas: 4612388
    }
  }
};
