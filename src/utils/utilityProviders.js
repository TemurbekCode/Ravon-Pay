// Kommunal to'lov toifalari uchun O'zbekistondagi haqiqiy provayderlarga o'xshash
// ro'yxat. Elektr/gaz/suv odatda hududiy monopoliya bo'lgani uchun bitta nom,
// internet/mobil aloqada esa foydalanuvchi haqiqiy raqobatchi kompaniyalardan
// birini tanlaydi (Click/Payme kabi ilovalardagi tanlov bilan bir xil mantiq).
export const UTILITY_PROVIDERS = {
  electricity: ['Hududiy elektr tarmoqlari'],
  gas: ['Hududgaz ta\'minoti'],
  water: ['Suv ta\'minoti va kanalizatsiya'],
  internet: ['UZONLINE', 'TPS Telecom', 'Sarkor Telecom', 'Universal Mobile'],
  mobile: ['Beeline', 'Ucell', 'UMS (Mobiuz)', 'Uzmobile'],
};

export const UTILITY_QUICK_AMOUNTS = [20000, 50000, 100000, 200000];
