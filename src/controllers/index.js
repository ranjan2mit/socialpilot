
var MongoClient = require('mongodb').MongoClient;
// var url = "mongodb://localhost:27017/";
var url = "mongodb+srv://socialpilot:1234567890@socialpilot.qooij.mongodb.net?retryWrites=true&w=majority"
module.exports.index = (req, res) => {
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("drive1")
    let hospitalCode = Number(req.params.hospitalCode)
    dbo.collection("hospital").findOne({hospitalCode: hospitalCode}, {projection: {_id: 0}}, function(err, hospitalresult) {
      if (err) throw res.send(err);
      if(!hospitalresult) {
        res.send({message: "Invalid hospitalCode"})
        return;
      }
       let storagevaccinedetails = hospitalresult.totalVacsinStorage;
       let bookedSlot = hospitalresult.bookedSlot
       let remainingvac = []
       let totalVaccineStorage = []
       let storagevaccineids = []
       //calculate remaining vaccines
       bookedSlot.forEach((ele) => {
        storagevaccinedetails.forEach((sele) => {
                  if(ele.code === sele.code) {
                    remainingvac.push({
                      code: ele.code,
                      count: sele.count - ele.count
                    })
                  } else {
                    remainingvac.push({
                      code: sele.code,
                      count: sele.count
                    })
                  }
                  storagevaccineids.push(sele.code)
                  totalVaccineStorage.push({
                    code: sele.code,
                    people:0
                  })
                })
       })
       dbo.collection("citizen").find({lastHospitalCode:hospitalCode, "vaccinations.isVaccinated":true, }, {projection: {_id: 0, lastHospitalCode:1, vaccinations:1}}).toArray(function(cerr, citizenresult) { 
        if (cerr) throw res.send(cerr);
        let citizenvac = {}
        citizenresult.forEach((cele) => {
           cele.vaccinations.forEach((ccele) => {
              if(storagevaccineids.indexOf(ccele.code) !== -1 ) {
                citizenvac[ccele.code] =  citizenvac[ccele.code] ?  citizenvac[ccele.code] + 1 : 1
              }
           })
        })
        // total Vaccine Storage
        totalVaccineStorage = totalVaccineStorage.map(ele => {
          ele.people =  citizenvac[ele.code]
          return ele;
        })
        dbo.collection("vaccinationsData").find({code:{$in: storagevaccineids}}, {projection: {_id: 0, code:1, name:1}}).toArray(function(verr, vaccinationresult) { 
          if (verr) throw res.send(verr);
          let vaccinenames = {}
          vaccinationresult.forEach((vele) => {
            vaccinenames[vele.code] = vele.name
          })
          remainingvac = remainingvac.map((ele) => {
             ele.name = vaccinenames[ele.code]
             return ele
          })
          totalVaccineStorage = totalVaccineStorage.map((ele) => {
            ele.name = vaccinenames[ele.code]
             return ele
          })
          let returnObj = {
            hospitalName: hospitalresult.name,
            address: Object.keys(hospitalresult.address).map((key) => hospitalresult.address[key]).join(','),
            totalVaccineStorage:totalVaccineStorage,
            remainingVaccine:remainingvac
          }
          db.close();
          res.send(returnObj);
        })
       })
    });
  });
};
