import database from '../models/database.ts';

const mediaController: any = {};

mediaController.pullAllMedia = async() => {
  await database.connect();
  const tables = await database.queryArray('SELECT * FROM "public"."Media"');
  // console.log('tables.rows', tables.rows);
  // iterate through each subarray in tables array and push each element of subarray to new object in array
  const resultArr: any = [];
  tables.rows.forEach((el) => {
    resultArr.push(
      { _id: el[0], type: el[1], title: el[2] }
    );
  });
  // console.log(resultArr);
  return resultArr;
}

export default mediaController;