const { verifyTypedData } = require("ethers/lib/utils");
const MedianAddress = require("../contracts/abis/Median-address.json")
const VatAddress = require("../contracts/abis/Vat-address.json")
const SpotAddress = require("../contracts/abis/Spotter-address.json")
const OSMAddress = require("../contracts/abis/OSM-address.json")
const JugAddress = require("../contracts/abis/Jug-address.json")
const DSRolesAddress =require("../contracts/abis/DSRoles-address.json")
const DaiAddress =require("../contracts/abis/DAI-address.json")
const DaiJoinAddress=require("../contracts/abis/DaiJoin-address.json")


async function main () {
    //Setup account 
    var [account0, account1, account2, account3] = await ethers.getSigners();

    console.log("contract owner", account0.address)
    console.log("account1", account1.address)
    console.log("account2", account2.address)
    console.log("account3", account3.address)


    const Median = await hre.ethers.getContractFactory("contracts/dai/oracle-module/median.sol:Median");
    const median = await Median.attach(MedianAddress.address);

    const Vat = await hre.ethers.getContractFactory("Vat");
    const vat = await Vat.attach(VatAddress.address);

    const Spot = await hre.ethers.getContractFactory("Spotter");
    const spot = await Spot.attach(SpotAddress.address);

    const OSM = await hre.ethers.getContractFactory("contracts/dai/oracle-module/osm.sol:OSM");
    const osm = await OSM.attach(OSMAddress.address);


    const Jug = await hre.ethers.getContractFactory("Jug");
    const jug = await Jug.attach(JugAddress.address);

    const Dai = await hre.ethers.getContractFactory("contracts/dai/liquidation-auction-module/token.sol:DSToken");
    const dai = await Dai.attach(DaiAddress.address);

    const DaiJoin = await hre.ethers.getContractFactory("contracts/dai/liquidation-auction-module/join.sol:DaiJoin");
    const daiJoin = await DaiJoin.attach(DaiJoinAddress.address);

    const Ds_Roles = await hre.ethers.getContractFactory("contracts/dai/proxy-module/roles.sol:DSRoles");
    const ds_roles = await Ds_Roles.attach(DSRolesAddress.address);


    //Auth to for some account permission to call lift
    tx = await median.connect(account0).rely(account1.address)
    tx2 = await median.connect(account0).rely(account2.address)
    tx3 = await median.connect(account0).rely(account3.address)

    //Now call lift() to add an account become trusting oracle
    await median.connect(account0).lift([account1.address, account2.address, account3.address])


    //Trusted oracle must sign message before verify on-chain
    //val, age,wat
    //oracle 1 price=400
    //oracle 2 price =450
    //oracle 3 price=500
    //Hash
    let priceType = await median.getWat()
    console.log("priceType:", priceType)
    let hash1 = ethers.utils.solidityKeccak256(['uint256', 'uint256', 'bytes32'],
        [ethers.utils.parseEther("400"), 1002, priceType])
    console.log("hash1:", hash1)
    //Sign
    const signature1 = await account1.signMessage(ethers.utils.arrayify(hash1))
    console.log("Signature1:", signature1)
    // For Solidity, we need the expanded-format of a signature
    let sig1 = ethers.utils.splitSignature(signature1);

    //Hash
    let hash2 = ethers.utils.solidityKeccak256(['uint256', 'uint256', 'bytes32'], [ethers.utils.parseEther("450"), 1004, priceType])
    console.log("hash2:", hash2)
    //Sign
    const signature2 = await account2.signMessage(ethers.utils.arrayify(hash2))
    console.log("Signature2:", signature2)
    let sig2 = ethers.utils.splitSignature(signature2);

    //Hash
    let hash3 = ethers.utils.solidityKeccak256(['uint256', 'uint256', 'bytes32'], [ethers.utils.parseEther("500"), 1009, priceType])
    console.log("hash3:", hash3)
    //Sign
    const signature3 = await account3.signMessage(ethers.utils.arrayify(hash3))
    console.log("Signature3:", signature3)
    let sig3 = ethers.utils.splitSignature(signature3);


    //Set bar
    await median.connect(account0).setBar(3)
    //Call poke() from median to set value
    let hash = await median.testHash(ethers.utils.parseEther("500"), 1002)
    console.log("hash", hash)
    await median.connect(account0).poke([ethers.utils.parseEther("400"),
    ethers.utils.parseEther("450"), ethers.utils.parseEther("500")],
        [1002, 1004, 1009],
        [sig1.v, sig2.v, sig3.v],
        [sig1.r, sig2.r, sig3.r],
        [sig1.s, sig2.s, sig3.s])


    //Kiss() to add account0 to whitelist=> have permission to read value
    await median.kiss(account0.address);

    //Now get latest price after 3 called of 3 oracle
    newOraclePrice = await median.connect(account0).peek()
    console.log(" New Update oracle Price:", newOraclePrice[0])


    //OSM get price from median
    //Add osm to whitelist
    await median.kiss(osm.address)
    //regularly call poke()
    await osm.connect(account0).poke()
    //Increase time between 2 time call
    //await time.increase(10000);
    await osm.connect(account0).poke()

    //Set pricefeed address for spot
    let what = await spot.stringToBytes32("pip")
    await spot.filez(priceType, what, osm.address)
    //Set liquidation ratio 1.5 *10^27 
    let what2 = await spot.stringToBytes32("mat")
    let decimal = ethers.BigNumber.from("1500000000000000000000000000")
    await spot.file(priceType, what2, decimal)

    //Add spot to white list
    await osm.kiss(spot.address)
    //Authorize for spot to call vat
    await vat.connect(account0).rely(spot.address)
    //Spot get price from OSM Post to Vat
    await spot.poke(priceType)

    //Check eventually price at Vat
    let spotPrice = await vat.getIlkSpotPrice(priceType)
    console.log("spot price", spotPrice)


    //----------------------------------------------INIT PARAMETER---------------------------------

    //Authorize for daiJoin
    await ds_roles.connect(account0).setRootUser(daiJoin.address, true);
    await dai.connect(account0).setAuthority(ds_roles.address)

    //init duty(stability fee for each ilk) & rho(last drip call ) in jug
    await jug.init(priceType)

    //set base(Global, per-second stability fee)
    base = await jug.stringToBytes32("base")
    await jug.file_base(base, 0)

    //Init rate in Vat
    await vat.connect(account0).init(priceType);

    //Set debt ceiling for BAT(line) and debt ceiling for all collateral(Line)
    //Total collateral ceiling debt is 800 DAI in 10^45 uint
    Line = await vat.stringToBytes32("Line")
    let decimal_Line = ethers.BigNumber.from("900000000000000000000000000000000000000000000000")
    await vat.connect(account0).file_Line(Line, decimal_Line)
    //Ceiling debt for BAT will be 400 DAI
    line = await vat.stringToBytes32("line")
    let decimal_line = ethers.BigNumber.from("700000000000000000000000000000000000000000000000")
    await vat.connect(account0).file(priceType, line, decimal_line)


}
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });