# Life expectancy at birth: external data

`life-expectancy.csv` and `datapackage.json` are copied unmodified from Our World in Data's dataset
"Life expectancy - Riley (2005), Clio Infra (2015), and UN (2019)" in the
[owid/owid-datasets](https://github.com/owid/owid-datasets) repository (OWID dataset id 1892, retrieved by OWID on 14 September 2019).

- Pre-1950 country estimates: Zijdeman R, Ribeira da Silva F (2015), *Life Expectancy at Birth (Total)*, Clio Infra, IISH Dataverse, hdl:10622/LKYT53.
- Regional and global estimates before 1950: Riley JC (2005), Estimates of regional and global life expectancy, 1800–2001, *Population and Development Review* 31(3):537–543.
- 1950–2019: United Nations Population Division, *World Population Prospects 2019*.

Our World in Data publishes its data under CC BY 4.0. `scripts/build-life-expectancy.mjs` turns this file into
`public/data/life-expectancy.json` (countries only, matched to the map by ISO code).
