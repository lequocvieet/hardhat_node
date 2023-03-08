const { verifyTypedData } = require("ethers/lib/utils");


async function main() {
  //------------------------------Set up oracle Price----------------------------------

  //Setup account 
  var [account0, account1, account2, account3, account4, account5, account10, account11, account12] = await ethers.getSigners();

  console.log("contract owner", account0.address)
  console.log("account1", account1.address)
  console.log("account2", account2.address)
  console.log("account3", account3.address)
  console.log("account4", account4.address)
  console.log("account5", account5.address)
  console.log("account10", account10.address)
  console.log("account11", account11.address)
  console.log("account12", account12.address)

  //---------------------------------CONTRACT OWNER DEPLOY------------------------
  //Deploy Vote
  VoteFactory = await hre.ethers.getContractFactory("VoteFactory");
  const vote = await VoteFactory.connect(account0).deploy();
  await vote.deployed();
  console.log("Vote contract deployed at ", vote.address)


  //Deploy Median contract
  Median = await hre.ethers.getContractFactory("contracts/dai/oracle-module/median.sol:Median");
  median = await Median.connect(account0).deploy();
  await median.deployed();
  console.log("Median deploy at:", median.address)


  //Deploy OSM contract
  OSM = await hre.ethers.getContractFactory("contracts/dai/oracle-module/osm.sol:OSM");
  osm = await OSM.connect(account0).deploy(median.address);
  await osm.deployed();
  console.log("OSM deploy at:", osm.address)


  //Deploy Vat 
  Vat = await hre.ethers.getContractFactory("Vat");
  vat = await Vat.connect(account0).deploy();
  await vat.deployed();
  console.log("Vat deploy at:", vat.address)

  //Deploy DSRoles contract an implement of authority for DSAuth contract
  DSRoles = await hre.ethers.getContractFactory("contracts/dai/proxy-module/roles.sol:DSRoles");
  ds_roles = await DSRoles.deploy()
  await ds_roles.deployed();
  console.log("DSRoles deploy at:", ds_roles.address)

  //Deploy Spot
  Spot = await hre.ethers.getContractFactory("Spotter");
  spot = await Spot.connect(account0).deploy(vat.address)
  await spot.deployed();
  console.log("Spot deploy at:", spot.address)

  //Deploy BAT token
  DSToken = await hre.ethers.getContractFactory("contracts/dai/liquidation-auction-module/token.sol:DSToken");
  bat = await DSToken.deploy("BAT");
  await bat.deployed();
  console.log("BAT deploy at:", bat.address)

  //Deploy Dai(DSToken) for using in DaiJoin
  Dai = await hre.ethers.getContractFactory("contracts/dai/liquidation-auction-module/token.sol:DSToken");
  dai = await DSToken.deploy("DAI");
  await dai.deployed();
  console.log("DAI deploy at:", dai.address)

  //Deploy DaiJoin contract
  DaiJoin = await hre.ethers.getContractFactory("contracts/dai/liquidation-auction-module/join.sol:DaiJoin");
  daiJoin = await DaiJoin.deploy(vat.address, dai.address)
  await daiJoin.deployed()
  console.log("DaiJoin deploy at:", daiJoin.address)

  //Deploy jug.sol(rate module) to implement jugLike interface
  Jug = await hre.ethers.getContractFactory("Jug");
  jug = await Jug.deploy(vat.address)
  await jug.deployed()
  console.log("Jug deploy at:", jug.address)

  //Deploy manager to implement managerLike interface
  DssCdpManager = await hre.ethers.getContractFactory("DssCdpManager");
  dssCdpManager = await DssCdpManager.deploy(vat.address)
  await dssCdpManager.deployed()
  console.log("DssCdpManager deploy at:", dssCdpManager.address)



  //---------------------------------------AUTHORIZE PERMISSION-------------------------

  //Authorize for jug to call vat
  await vat.connect(account0).rely(jug.address)

  //Authorize for daiJoin.sol permission to call mint
  await ds_roles.connect(account0).setRootUser(daiJoin.address, true);
  await dai.connect(account0).setAuthority(ds_roles.address)


  saveBuildFiles(vote, "VoteFactory", "")
  saveBuildFiles(dssCdpManager, "DssCdpManager", "")
  saveBuildFiles(jug, "Jug", "")
  saveBuildFiles(daiJoin, "DaiJoin", "contracts/dai/liquidation-auction-module/ETHJoin.sol:DaiJoin")
  saveBuildFiles(median, "Median", "")
  saveBuildFiles(osm, "OSM", "contracts/dai/oracle-module/osm.sol:OSM")
  saveBuildFiles(spot, "Spotter", "")
  saveBuildFiles(vat, "Vat", "")
  saveBuildFiles(bat, "BAT", "contracts/dai/liquidation-auction-module/token.sol:DSToken")
  saveBuildFiles(dai, "DAI", "contracts/dai/liquidation-auction-module/token.sol:DSToken")
  saveBuildFiles(ds_roles, "DSRoles", "contracts/dai/proxy-module/roles.sol:DSRoles")

}

function saveBuildFiles(contract, name, artifact_direct) {

  const fs = require("fs");

  const contractsDir = __dirname + "/../contracts/abis";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    contractsDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );
  let contractArtifact = {};
  if (artifact_direct != "") {
    contractArtifact = artifacts.readArtifactSync(artifact_direct);
  } else {
    contractArtifact = artifacts.readArtifactSync(name);
  }

  fs.writeFileSync(
    contractsDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );

  //Save file to Backend directory

  const backEndDir = "/home/pham/aragon-client/Dai_BackEnd/abis";
  if (!fs.existsSync(backEndDir)) {
    fs.mkdirSync(backEndDir);
  }


  fs.writeFileSync(
    backEndDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );
  if (artifact_direct != "") {
    const contractArtifact = artifacts.readArtifactSync(artifact_direct);
  } else {
    const contractArtifact = artifacts.readArtifactSync(name);
  }

  fs.writeFileSync(
    backEndDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );

  //Save file to FrontEnd directory

  const frontEndDir = "/home/pham/aragon-client/aragon_client/src/abis";
  if (!fs.existsSync(frontEndDir)) {
    fs.mkdirSync(frontEndDir);
  }


  fs.writeFileSync(
    frontEndDir + `/${name}-address.json`,
    JSON.stringify({ address: contract.address }, undefined, 2)
  );
  if (artifact_direct != "") {
    const contractArtifact = artifacts.readArtifactSync(artifact_direct);
  } else {
    const contractArtifact = artifacts.readArtifactSync(name);
  }

  fs.writeFileSync(
    frontEndDir + `/${name}.json`,
    JSON.stringify(contractArtifact, null, 2)
  );

}



main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });