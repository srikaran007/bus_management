const { Op } = require("sequelize");
const { ROLES } = require("./constants");

const getAssignedScope = async (req, models) => {
  const role = req.user?.role;
  const scope = {
    busId: null,
    busNumber: req.user?.assignedBusNumber || null,
    routeName: req.user?.assignedRouteName || null,
    driverId: null
  };

  if (role === ROLES.STUDENT) {
    const student = await models.Student.findOne({ where: { user: req.user.id } });
    if (student) {
      scope.busNumber = scope.busNumber || student.busNumber || null;
      scope.routeName = scope.routeName || student.routeName || null;
    }
  }

  if (role === ROLES.DRIVER) {
    const driver = await models.Driver.findOne({
      where: {
        [Op.or]: [
          { driverName: req.user?.name || "" },
          { driverId: req.user?.name || "" },
          ...(req.user?.phone ? [{ phone: req.user.phone }] : [])
        ]
      }
    });

    if (driver) {
      scope.driverId = driver.id;
      scope.busId = driver.assignedBus || null;
    }
  }

  if (scope.busId && !scope.busNumber) {
    const bus = await models.Bus.findByPk(scope.busId);
    scope.busNumber = bus?.busNumber || null;
  }

  if (!scope.busId && scope.busNumber) {
    const bus = await models.Bus.findOne({ where: { busNumber: scope.busNumber } });
    scope.busId = bus?.id || null;
  }

  if (!scope.routeName && scope.busId) {
    const route = await models.Route.findOne({
      where: { assignedBus: scope.busId },
      order: [["createdAt", "DESC"]]
    });
    if (route) {
      scope.routeName = route.routeName;
    }
  }

  return scope;
};

module.exports = { getAssignedScope };
