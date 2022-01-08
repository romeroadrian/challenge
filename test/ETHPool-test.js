const { expect } = require("chai");
const { ethers } = require("hardhat");

const p = ethers.utils.parseEther;

describe("ETHPool", function () {
  let deployer;
  let instance;

  beforeEach(async function() {
    [deployer, alice, bob] = await ethers.getSigners();

    const ETHPool = await ethers.getContractFactory("ETHPool");
    instance = await ETHPool.deploy();
    await instance.deployed();
  });

  describe('deposit', function() {
    it('throws if call value is 0', async function() {
      const value = 0;

      await expect(instance.connect(alice).deposit({ value }))
        .to.be.revertedWith('send some eth ser');
    });

    it('deposits eth to contract', async function() {
      const value = p('0.5');

      await expect(() => instance.connect(alice).deposit({ value }))
        .to.changeEtherBalances([alice, instance], [value.mul(-1), value]);
    });

    it('emits event', async function() {
      const value = p('0.5');

      await expect(await instance.connect(alice).deposit({ value }))
        .to.emit(instance, 'Deposited')
        .withArgs(alice.address, value);
    });
  });

  describe('withdraw', function() {
    it('throws if no previous deposit', async function() {
      await expect(instance.connect(alice).withdraw())
        .to.be.revertedWith('you didnt send any eth ser');
    });

    it('withdraws eth from contract', async function() {
      const value = p('0.1');

      const depositTx = await instance.connect(alice).deposit({ value });
      await depositTx.wait();

      await expect(() => instance.connect(alice).withdraw())
        .to.changeEtherBalances([instance, alice], [value.mul(-1), value]);
    });

    it('emits event', async function() {
      const value = p('0.1');

      const depositTx = await instance.connect(alice).deposit({ value });
      await depositTx.wait();

      await expect(await instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, value);
    });
  });

  describe('receive()', function() {
    context('with previous deposit', () => {
      beforeEach(async function() {
        const depositTx = await instance.connect(alice).deposit({ value: 1 });
        await depositTx.wait();
      });

      it('lets team members add eth to the pool', async function() {
        const value = p('1');

        await expect(() => deployer.sendTransaction({ to: instance.address, value }))
          .to.changeEtherBalances([deployer, instance], [value.mul(-1), value]);
      });

      it('emits event', async function() {
        const value = p('1');

        await expect(deployer.sendTransaction({ to: instance.address, value }))
          .to.emit(instance, 'RewardsAdded')
          .withArgs(deployer.address, value);
      });

      it('throws if non team member adds to the pool', async function() {
        const value = p('1');

        await expect(bob.sendTransaction({ to: instance.address, value }))
          .to.revertedWith('restricted to team members only');
      });
    });

    it('throws if there are no deposits in the pool', async function() {
      const value = p('1');

      await expect(deployer.sendTransaction({ to: instance.address, value }))
        .to.be.revertedWith('cant deposit rewards if there are no deposits');
    });
  });

  describe('cases', function() {
    it('DA-WA', async function() {
      const depositATx = await instance.connect(alice).deposit({ value: 1 });
      await depositATx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, 1);

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);
    });

    it('DA-DB-WA-WB', async function() {
      const depositATx = await instance.connect(alice).deposit({ value: 1 });
      await depositATx.wait();

      const depositBTx = await instance.connect(bob).deposit({ value: 2 });
      await depositBTx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, 1);

      expect(await ethers.provider.getBalance(instance.address)).to.equal(2);

      await expect(instance.connect(bob).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(bob.address, 2);

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);
    });

    it('DA-T-WA', async function() {
      const depositATx = await instance.connect(alice).deposit({ value: 1 });
      await depositATx.wait();

      const rewardTx = await deployer.sendTransaction({ to: instance.address, value: 1 });
      await rewardTx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, 2);
    });

    it('DA-BD-T-WA-WB', async function() {
      const depositATx = await instance.connect(alice).deposit({ value: 1 });
      await depositATx.wait();

      const depositBTx = await instance.connect(bob).deposit({ value: 2 });
      await depositBTx.wait();

      const rewardTx = await deployer.sendTransaction({ to: instance.address, value: 3 });
      await rewardTx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, 2);

      expect(await ethers.provider.getBalance(instance.address)).to.equal(4);

      await expect(instance.connect(bob).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(bob.address, 4);

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);
    });

    it('DA-T-DB-WA-WB', async function() {
      const depositATx = await instance.connect(alice).deposit({ value: p('1') });
      await depositATx.wait();

      const rewardTx = await deployer.sendTransaction({ to: instance.address, value: p('3') });
      await rewardTx.wait();

      const depositBTx = await instance.connect(bob).deposit({ value: p('2') });
      await depositBTx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, p('4'));

      expect(await ethers.provider.getBalance(instance.address)).to.equal(p('2'));

      await expect(instance.connect(bob).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(bob.address, p('2'));

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);
    });


    it('DA-DA-T-WA', async function() {
      const depositA1Tx = await instance.connect(alice).deposit({ value: p('1') });
      await depositA1Tx.wait();

      const depositA2Tx = await instance.connect(alice).deposit({ value: p('2') });
      await depositA2Tx.wait();

      const rewardTx = await deployer.sendTransaction({ to: instance.address, value: p('5') });
      await rewardTx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, p('8'));

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);
    });

    it('DA-DB-DA-T-WA-WB', async function() {
      const depositA1Tx = await instance.connect(alice).deposit({ value: p('1') });
      await depositA1Tx.wait();

      const depositBTx = await instance.connect(bob).deposit({ value: p('4') });
      await depositBTx.wait();

      const depositA2Tx = await instance.connect(alice).deposit({ value: p('2') });
      await depositA2Tx.wait();

      const rewardTx = await deployer.sendTransaction({ to: instance.address, value: p('7') });
      await rewardTx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, p('6'));

      await expect(instance.connect(bob).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(bob.address, p('8'));

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);
    });

    it('DA-T-WA-DA-T-WA', async function() {
      const depositA1Tx = await instance.connect(alice).deposit({ value: p('1') });
      await depositA1Tx.wait();

      const reward1Tx = await deployer.sendTransaction({ to: instance.address, value: p('1') });
      await reward1Tx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, p('2'));

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);

      const depositA2Tx = await instance.connect(alice).deposit({ value: p('5') });
      await depositA2Tx.wait();

      const reward2Tx = await deployer.sendTransaction({ to: instance.address, value: p('7') });
      await reward2Tx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, p('12'));

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);
    });

    it('DA-BD-T-T-WA-WB', async function() {
      const depositATx = await instance.connect(alice).deposit({ value: p('1') });
      await depositATx.wait();

      const depositBTx = await instance.connect(bob).deposit({ value: p('2') });
      await depositBTx.wait();

      const reward1Tx = await deployer.sendTransaction({ to: instance.address, value: p('3') });
      await reward1Tx.wait();

      const reward2Tx = await deployer.sendTransaction({ to: instance.address, value: p('12') });
      await reward2Tx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, p('6'));

      expect(await ethers.provider.getBalance(instance.address)).to.equal(p('12'));

      await expect(instance.connect(bob).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(bob.address, p('12'));

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);
    });

    it('DA-BD-T-WA-T-WB', async function() {
      const depositATx = await instance.connect(alice).deposit({ value: p('1') });
      await depositATx.wait();

      const depositBTx = await instance.connect(bob).deposit({ value: p('2') });
      await depositBTx.wait();

      const reward1Tx = await deployer.sendTransaction({ to: instance.address, value: p('3') });
      await reward1Tx.wait();

      await expect(instance.connect(alice).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(alice.address, p('2'));

      const reward2Tx = await deployer.sendTransaction({ to: instance.address, value: p('3') });
      await reward2Tx.wait();

      expect(await ethers.provider.getBalance(instance.address)).to.equal(p('7'));

      await expect(instance.connect(bob).withdraw())
        .to.emit(instance, 'Withdrawn')
        .withArgs(bob.address, p('7'));

      expect(await ethers.provider.getBalance(instance.address)).to.equal(0);
    });
  });
});
