const { AssetType } = require("../models");

const getAssetTypeByCode = async (code) => {
  return await AssetType.findOne({
    where: { code, is_active: true },
  });
};

const getAssetTypeById = async (id) => {
  return await AssetType.findByPk(id);
};

const getAllAssetTypes = async () => {
  return await AssetType.findAll({
    where: { is_active: true },
  });
};

module.exports = {
  getAssetTypeByCode,
  getAssetTypeById,
  getAllAssetTypes,
};
