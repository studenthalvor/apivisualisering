import ReactApexChart from "react-apexcharts";
import { useEffect } from 'react';
import { useState } from 'react/cjs/react.development';
import './App.css';

/* 
- Dropdown for å stille stroke
- Mulighet for å dele opp i årstall
- Knapper for å kunne velge graftype
 */


function getNaeringskategorier() {
  return fetch('https://data.ssb.no/api/v0/no/table/08785/ ', { method: 'GET' })
    .then(response => response.json());
  // kna data
  // slå sammen kvartal, velge år av gangen, velge nye charts
}

function getYakseverdier(utgaaende) {
  const query = {
    "query": [
      {
        "code": "Inngaaende2",
        "selection": {
          "filter": "item",
          "values": [
            utgaaende ? "02" : "01"
          ]
        }
      },
      {
        "code": "NACE2007",
        "selection": {
          "filter": "item",
          "values": [
            "A",
            "B",
            "C",
            "D",
            "E",
            "F",
            "G",
            "H",
            "I",
            "J",
            "L",
            "M",
            "N",
            "O",
            "P",
            "Q",
            "R",
            "S",
            "U",
            "Z"
          ]
        }
      }
    ],
    "response": {
      "format": "json-stat2"
    }
  }

  const options = {
    method: 'POST',
    body: JSON.stringify(query)
  }
  return fetch('https://data.ssb.no/api/v0/no/table/08785/', options)
    .then(response => response.json());
}

function grafConfig(kategorier, akseverdier) {
  let graf = {
    options: {
      stroke: { width: 2 },
      chart: {
        id: "basic-bar"
      },
      xaxis: {
        categories: []
      }
    },
    series: []
  };


  // Setter kategorier til x-aksen. Kvartal og årstall. 
  const kvartal = kategorier['variables'][3]['values'];
  for (const key in kvartal) {
    graf.options.xaxis.categories[key] = kvartal[key].substring(0, 4) + "-" + kvartal[key].substring(4, 6);
  }

  // Setter serier. (Næringer).
  const naeringer = kategorier['variables'][1]['valueTexts'];
  for (const key in naeringer) {
    graf.series.push({
      "name": naeringer[key]
    });
  }


  const antallKvartaler = akseverdier.size[3];
  const antallNaeringer = kategorier['variables'][1]['valueTexts'];

  let y = 0;
  // Setter verdier/datapunkter for hver næring.
  for (const key in antallNaeringer) {
    const liste = akseverdier.value.slice(y * antallKvartaler, antallKvartaler + (y * antallKvartaler));
    graf.series[key]['data'] = liste;
    y++;
  }

  // Styler grafene
  graf['options']['xaxis']['labels'] = {
    style: {
      colors: '#b3b3b3',
      fontSize: '14px'
    }
  }
  graf['options']['yaxis'] = {
    labels: {
      style: {
        colors: '#b3b3b3',
        fontSize: '14px'
      }
    }
  }
  graf['options']['legend'] = {
    fontSize: '16px',
    labels: {
      colors: '#ffffff'
    }
  }

  return graf;
}

function App() {
  let [kategorier, setKategorier] = useState();
  let [akseverdier, setAkseverdier] = useState();
  let [utgaaende, setUtgaaende] = useState(false);
  let [tittel, setTittel] = useState();

  useEffect(() => {
    getNaeringskategorier().then(setKategorier);
    getYakseverdier(utgaaende).then(setAkseverdier);
    setTittel("Betalingstrømmer mellom Norge og utlandet i millioner kr, etter kvartal, " + (utgaaende ? "inngående verdi " : "utgående verdi ") + "og næring");
  }, [utgaaende]);

  let [chartOptions, setChartOptions] = useState();

  useEffect(() => {
    if (kategorier === undefined || akseverdier === undefined) {
      return;
    }
    // Beregner data til graf og presenterer.
    const grafCfg = grafConfig(kategorier, akseverdier);
    setChartOptions(grafCfg);

  }, [kategorier, akseverdier]);


  if (chartOptions === undefined) {
    return <div id="loading">Loading...</div>;
  }
  return (
    <>
      <header>{tittel}</header>
      <main>
        <div id="panel">
          <div id="knappewrapper">
            <button id="knapp-ut" onClick={() => setUtgaaende(false)}>Utgående</button>
            <button id="knapp-inn" onClick={() => setUtgaaende(true)}>Inngående</button>
          </div>
          <ReactApexChart
            grid={chartOptions.grid}
            options={chartOptions.options}
            series={chartOptions.series}
            width={window.innerWidth * .9}
            height={window.innerHeight * .8}
            type="line"
          />
        </div>
      </main>
    </>
  );
}

export default App;
