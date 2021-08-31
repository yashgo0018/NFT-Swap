const Sequelize = require('sequelize');
const db = require('../database');

const Swap = db.define('swap', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  swap_id: {
    type: Sequelize.INTEGER,
    unique: true
  },
  swap_create_transaction: {
    type: Sequelize.STRING,
    allowNull: true
  },
  swap_executed_transaction: {
    type: Sequelize.STRING,
    allowNull: true
  },
  creator: Sequelize.STRING,
  contract_1_address: Sequelize.STRING,
  token_1: Sequelize.STRING,
  type_1: Sequelize.TINYINT,
  contract_2_address: Sequelize.STRING,
  token_2_owner: {
    type: Sequelize.STRING,
    allowNull: true
  },
  token_2: Sequelize.STRING,
  type_2: Sequelize.TINYINT,
  done: {
    type: Sequelize.BOOLEAN,
    default: false
  },
  cancelled: {
    type: Sequelize.BOOLEAN,
    default: false
  }
}, {
  underscored: true
});

module.exports = Swap;