import ReactApexChart from "react-apexcharts";
import { useEffect } from 'react';
import { useState } from 'react/cjs/react.development';
import './App.css';


// API-kall for å hente kategorier til graf
function getNaeringskategorier() {
  return fetch('https://data.ssb.no/api/v0/no/table/08785/ ', { method: 'GET' })
    .then(response => response.json());

}

// API-kall med query for å hente datapunkter. "utgaaende"-argumentet endrer API-spørringen på "inngående" eller "utgående".
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

// Funksjon for å konfigurere graf.
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

  // Setter serier(Næringer).
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

  // Styler grafene med farge og fontstørrelse
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
  // States for data til graf
  let [kategorier, setKategorier] = useState();
  let [akseverdier, setAkseverdier] = useState();
  // Hvilken graf som skal vises. Utgående som default.
  let [utgaaende, setUtgaaende] = useState(false);

  let [tittel, setTittel] = useState();
  let [chartOptions, setChartOptions] = useState();

  useEffect(() => {
    // Api-kall som blir kjørt når man velger "utgående" eller "inngående" graf via grønn og rød knapp.

    getNaeringskategorier().then(setKategorier);
    getYakseverdier(utgaaende).then(setAkseverdier);
    setTittel("Betalingstrømmer mellom Norge og utlandet i millioner kr, etter kvartal, " + (utgaaende ? "inngående verdi " : "utgående verdi ") + "og næring");
  }, [utgaaende]);


  // Hook som setter grafkonfigurasjon så fort API-kallet er returnert
  useEffect(() => {
    if (kategorier === undefined || akseverdier === undefined) {
      return;
    }
    // Beregner data til graf via funksjonen grafConfig() og setter state 
    const grafCfg = grafConfig(kategorier, akseverdier);
    setChartOptions(grafCfg);
  }, [kategorier, akseverdier]);

  // Sjekk på om graf har fått konfigurasjon
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
