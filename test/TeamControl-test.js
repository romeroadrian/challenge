const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TeamControl", function () {
  let deployer;
  let instance;

  beforeEach(async function() {
    [deployer, bob, alice] = await ethers.getSigners();

    const TeamControlMock = await ethers.getContractFactory("TeamControlMock");
    instance = await TeamControlMock.deploy();
    await instance.deployed();
  });

  it('makes deployer team member by default', async function() {
    expect(await instance.isTeamMember(deployer.address)).to.be.true;
  });

  it('adds an account to the team', async function() {
    const addTx = await instance.connect(deployer).addTeamMember(bob.address);
    await addTx.wait();

    expect(await instance.isTeamMember(bob.address)).to.be.true;
  });

  it('removes an account from the team', async function() {
    const addTx = await instance.connect(deployer).addTeamMember(bob.address);
    await addTx.wait();

    expect(await instance.isTeamMember(bob.address)).to.be.true;

    const removeTx = await instance.connect(deployer).removeTeamMember(bob.address);
    await removeTx.wait();

    expect(await instance.isTeamMember(bob.address)).to.be.false;
  });

  it('allows members to call onlyTeam functions', async function() {
    const modifyTx = await instance.connect(deployer).modify();
    await modifyTx.wait();

    expect(await instance.modified()).to.be.true;
  });

  it('should not allow non members to call onlyTeam functions', async function() {
    await expect(instance.connect(alice).modify())
      .to.be.revertedWith('restricted to team members only');

    expect(await instance.modified()).to.be.false;
  });
});
