import fetch from 'node-fetch';

const apiUrl = ''; // Endpoint là Agents
const apiKey = ''; // Khóa API của Gcalls

const nocodbUrl = '';
const nocodbApiKey = ''; // Khóa API của NocoDB

const options = {
  method: 'POST',
  headers: {
    'Accept': 'text/csv',
    'x-apikey': `${apiKey}`
  },
};

// Đề phòng khi có thuộc tính nằm trong thuộc tính, ta sẽ đưa chúng cùng 1 level
function flattenObject(obj) {
  const result = {};
  function flatten(obj, prefix = '') {
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${key}` : key;
      if (typeof value === 'object' && value !== null) {
        flatten(value, newKey);
      } else {
        result[newKey] = value;
      }
    }
  }
  flatten(obj);
  return result;
}

let pageLeft = 9
let end_page = 6

function addMoreRecord(pageLeft, startPage) {
  if (pageLeft > 0) {
    fetchDataAndImport(pageLeft, startPage)
  }
}

async function fetchDataAndImport(pageLeft, startPage) {
  let recordCount = 0
  //let limit = 20;
  let hasMore = true; // Vẫn còn dữ liệu không?
  let allResults = []; // Tập hợp mọi kết quả ở đây
  
  if (pageLeft >= 6) {
    end_page = startPage + 5
    pageLeft -= 6
  } else {
    end_page = startPage + pageLeft - 1
    pageLeft = 0
  }
  console.log(end_page)
  while (hasMore && startPage <= end_page) {
    const response = await fetch(`${apiUrl}?page=${startPage}`, options);

    if (!response.ok) {
      throw new Error(`Network response was not ok (status ${response.status})`);
    }

    const json = await response.json();
    allResults = allResults.concat(json.result);

    hasMore = json.hasMore; // Vẫn còn ư?
    startPage++; // Thêm 1 trang
  }
    
    for (const record of allResults) {
      // Cho mọi thuộc tính về 1 level
      const flatten_record = flattenObject(record)
      //console.log(JSON.stringify(flatten_record))
      const options = {
        method: 'POST',
        headers: {
          'xc-token': `${nocodbApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(flatten_record)
      };
      
      // Đưa lên NocoDB. Dãy kí tự sau tables là ID của bảng
      const createResponse = await fetch(`${nocodbUrl}/api/v2/tables/mkutb3ewou2phpd/records`, options);
  
      if (!createResponse.ok) {
        console.error(`Error creating record: ${createResponse.statusText}`);
        recordCount += 1
      } else {
        recordCount += 1
        // console.log('Record created successfully:', await createResponse.json());
        console.log(recordCount)
      }
    }
    
    console.log("Wait 40 sec.");
    if (pageLeft != 0) {
      setTimeout(() => {
        addMoreRecord(pageLeft, end_page + 1)
      }, 40000);
    }
  }

addMoreRecord(pageLeft, 1)