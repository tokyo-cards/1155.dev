// describe("Greeter", function () {
//   it("Should return the new greeting once it's changed", async function () {
//     const Greeter = await ethers.getContractFactory("Greeter");
//     const greeter = await Greeter.deploy("Hello, world!");
//     await greeter.deployed();
// 
//     console.log(await greeter.greet());
// 
//     const setGreetingTx = await greeter.setGreeting("Hola, mundo!");
// 
//     // wait until the transaction is mined
//     await setGreetingTx.wait();
// 
//     console.log(await greeter.greet());
//   });
// });
