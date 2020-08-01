var healthData;
var mainChart;
var SevenDayChart;
const dataTable = document
  .getElementById("dataTable")
  .getElementsByTagName("tbody")[0];
const loadingContainer = document.getElementById("loading");
const dateContainer = document
  .getElementById("casesNewTotalTable")
  .getElementsByTagName("h2")[0];
const newCasesTitle = document
  .getElementById("newCases")
  .getElementsByTagName("h2")[0];
const mainTitle = document.getElementById("mainHeading");
const sevDayTotal = document.getElementById("SevDayTotal");

const newCasesArray = [];
const totalCasesArray = [];
const newHospAdmArray = [];
const totalHospAdmArray = [];
const newDeathsArray = [];
const totalDeathsArray = [];
const municipalityArray = [];
const sevenDayCaseLoad = [];
const weekBeforeCurrentLoad = [];

loadingContainer.innerHTML = "LOADING";

fetch(
  "https://data.rivm.nl/covid-19/COVID-19_aantallen_gemeente_cumulatief.json"
)
  .then((res) => res.json())
  .then((data) => {
    healthData = Object.entries(groupBy(data, "Date_of_report"));
  })
  .then(() => {
    mountData(healthData);

    updateHeaders(healthData);
    addEventHandlersTH();
    sortTable(
      document.getElementById("dataTable").getElementsByTagName("tbody")[0],
      1
    );
    loadingContainer.innerHTML = "";
  })
  .then(() => {
    mainChart = generateNewCasesChart();
    SevenDayChart = generate7DayChart();
    generateCasesPerDayChart(healthData);
  });

function groupBy(objectArray, property) {
  return objectArray.reduce((acc, obj) => {
    let key = obj[property];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(obj);
    return acc;
  }, {});
}

function add(acc, cV) {
  return acc + cV;
}

//Helper function to add new row to dataTable. Function takes cell data as Array
function addNewRow(tableBody, dataArray, atTop) {
  let newRow = tableBody.insertRow(atTop ? 0 : -1);

  dataArray.forEach((element) => {
    let dataCell = newRow.insertCell();
    dataCell.appendChild(document.createTextNode(element));
  });
}

function sortTable(table, cellIndex) {
  let sorting = true;
  let rows,
    x,
    y = 0;

  while (sorting) {
    sorting = false;
    rows = table.rows;
    for (let i = 1; i < rows.length - 1; i++) {
      x = rows[i].getElementsByTagName("td")[cellIndex];
      y = rows[i + 1].getElementsByTagName("td")[cellIndex];
      if (Number(x.innerHTML) < Number(y.innerHTML)) {
        sorting = true;
        rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      }
    }
  }
}

function addEventHandlersTH() {
  let thList = document
    .getElementById("dataTable")
    .getElementsByTagName("thead")[0]
    .getElementsByTagName("tr")[0].children;

  for (let i = 0; i < thList.length; i++) {
    thList[i].addEventListener("click", (e) => {
      sortTable(dataTable, [...thList].indexOf(e.target));
    });
  }
}

function resetChart() {
  mainChart.destroy();
}

function updateHeaders(data, offset = 0) {
  dateContainer.innerText =
    dateContainer.innerText +
    " (Last Update: " +
    data[data.length - 1 - offset][0] +
    ")";

  mainTitle.innerText +=
    " (Last Update: " + data[data.length - 1 - offset][0] + ")";
}

function generate7DayChart() {
  let filteredArrNums = [];
  let filteredArrNames = [];

  sevenDayCaseLoad.forEach((el, i) => {
    if (el > 0) {
      filteredArrNums.push(el);
      filteredArrNames.push(municipalityArray[i]);
    }
  });

  var chart = bb.generate({
    bindto: "#weekBeforeCompare",

    data: {
      colors: { "Seven Day Case Load": "darkblue" },
      columns: [["Seven Day Case Load", ...filteredArrNums]],
      type: "bar",
    },
    axis: {
      x: {
        tick: { text: { show: false } },
        type: "category",
        categories: filteredArrNames,
      },
    },
  });

  let totalCases7Days = sevenDayCaseLoad.reduce(add);

  sevDayTotal.innerText =
    "Cases in the last 7 Days reported in " +
    filteredArrNums.length +
    " Municipalities, " +
    totalCases7Days +
    " in total (" +
    (totalCases7Days / 7).toFixed(2) +
    " per day on average)";

  return chart;
}

function generateCasesPerDayChart(data) {
  let dateArray = [];
  let dataArray = [];
  let finalDataArray = [];

  for (let i = data.length - 8; i < data.length; i++) {
    dateArray.push(data[i][0].split(" ")[0]);
    let tempArr = [];
    data[i][1].forEach((el) => {
      tempArr.push(el.Total_reported);
    });
    dataArray.push(tempArr);
  }
  dateArray.shift();

  for (let i = 0; i < dataArray.length - 1; i++) {
    finalDataArray.push(
      dataArray[i + 1].reduce(add) - dataArray[i].reduce(add)
    );
  }

  var chart = bb.generate({
    bindto: "#chartCasesLastWeekPerDay",

    data: {
      colors: {
        "New Cases Per Day": "gold",
      },
      columns: [["New Cases Per Day", ...finalDataArray]],
      type: "bar",
      labels: true,
    },
    axis: {
      x: {
        type: "category",
        categories: dateArray,
      },
    },
  });
}

function generateNewCasesChart() {
  let filteredArrNums = [];
  let filteredArrNames = [];
  let filteredHosAdm = [];

  newCasesArray.forEach((el, i) => {
    if (el > 0) {
      filteredArrNums.push(el);
      filteredArrNames.push(municipalityArray[i]);
      filteredHosAdm.push(newHospAdmArray[i]);
    }
  });

  newHospAdmArray.forEach((el, i) => {
    if (el > 0 && !filteredArrNames.includes(municipalityArray[i])) {
      filteredArrNames.push(municipalityArray[i]);
      filteredHosAdm.push(el);
    }
  });

  newCasesTitle.innerText +=
    " (reported in " + filteredArrNames.length + " municipalities)";

  var chart = bb.generate({
    bindto: "#chartNewCases",

    data: {
      columns: [
        ["New Cases", ...filteredArrNums],
        ["New Hospital Adm.", ...filteredHosAdm],
      ],
      type: "bar",
      groups: [["New Cases", "New Hospital Adm."]],
    },
    axis: {
      x: {
        tick: { text: { show: false } },
        type: "category",
        categories: filteredArrNames,
      },
    },
  });

  return chart;
}

function mountData(data, offset = 0) {
  let latest = data[data.length - 1 - offset];
  let dayBefore = data[data.length - 2 - offset];

  let aWeekAgo = data[data.length - 8 - offset];
  let twoWeeksAgo = data[data.length - 15 - offset];

  for (let index = 0; index < latest[1].length; index++) {
    let currentElement = latest[1][index];
    let dayBefElement = dayBefore[1][index];
    let weekBefElement = aWeekAgo[1][index];
    let twoWeeksBefElement = twoWeeksAgo[1][index];

    sevenDayCaseLoad.push(
      currentElement.Total_reported - weekBefElement.Total_reported
    );

    weekBeforeCurrentLoad.push(
      weekBefElement.Total_reported - twoWeeksBefElement.Total_reported
    );

    let numNewCases =
      currentElement.Total_reported - dayBefElement.Total_reported;
    let numNewHospital =
      currentElement.Hospital_admission - dayBefElement.Hospital_admission;
    let numNewDeaths = currentElement.Deceased - dayBefElement.Deceased;

    newCasesArray.push(numNewCases);
    totalCasesArray.push(currentElement.Total_reported);
    newHospAdmArray.push(numNewHospital);
    totalHospAdmArray.push(currentElement.Hospital_admission);
    newDeathsArray.push(numNewDeaths);
    totalDeathsArray.push(currentElement.Deceased);
    municipalityArray.push(
      currentElement.Municipality_name
        ? currentElement.Municipality_name
        : currentElement.Province + " (P)"
    );

    addNewRow(
      dataTable,
      [
        currentElement.Municipality_name
          ? currentElement.Municipality_name
          : currentElement.Province + " (P)",
        numNewCases,
        currentElement.Total_reported - weekBefElement.Total_reported,
        currentElement.Total_reported,
        numNewHospital,
        currentElement.Hospital_admission,
        numNewDeaths,
        currentElement.Deceased,
      ],
      false
    );
  }

  addNewRow(
    dataTable,
    [
      "NETHERLANDS",
      newCasesArray.reduce(add),
      sevenDayCaseLoad.reduce(add),
      totalCasesArray.reduce(add),
      newHospAdmArray.reduce(add),
      totalHospAdmArray.reduce(add),
      newDeathsArray.reduce(add),
      totalDeathsArray.reduce(add),
    ],
    true
  );
}
