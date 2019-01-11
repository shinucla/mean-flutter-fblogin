'user strict';

module.exports = function (Sequelize) {
  return { schema: { first_name: { type: Sequelize.DataTypes.STRING, allowNull: false, defaultValue: 'Guest' },
                     last_name: { type: Sequelize.DataTypes.STRING, allowNull: false, defaultValue: 'Guest' },
                     email: { type: Sequelize.DataTypes.STRING, allowNull: false },
                     status_bit: { type: Sequelize.DataTypes.INTEGER, allowNull: false },        // 0: delete 1: active 2: inactive
                     role: { type: Sequelize.DataTypes.STRING, allowNull: false },               // lower case: 'admin', 'member', 'guest'

                     device_id: { type: Sequelize.DataTypes.STRING, allowNull: true },
                   },
           indexes: [{ unique: true, fields: ['email'] }],

           classMethods: {

           },

           instanceMethods: {
	     
           },
         };
};
