"""Builds research/wikipedia-queue.json: every entry of Wikipedia's 'Timeline of medicine and
medical technology' (read 19 Nov 2026), with its status in the atlas.
status: pending | duplicate (already an atlas milestone) | no-event (the entry names a person
or work but describes no event) | added (verified and added) | rejected (could not be verified,
or verification showed the claim is wrong; see note)."""
import json
RAW = r"""
c. 12000 BC|Unnamed Palaeolithic man|Earliest known dental caries manipulation|Northern Italy|Y|duplicate:villabruna-dental
7300-6200 BC|-|Trepanation with healing, Ukrainian skull|Ukraine|Y|duplicate:european-trepanation
3350-3105 BC|Ötzi|Carried birch fungus, possibly against whipworm|-|Y|
3000 BC|-|Origins of Ayurveda placed around 3000 BCE|-|Y|
c. 2600 BC|Imhotep|Priest-physician later deified as god of medicine|-|Y|
2500 BC|Iry|Inscription describes a palace physician's roles|Egypt|Y|
1900-1600 BC|-|Akkadian medical tablets, copies in Ashurbanipal's Nineveh library|Nineveh|Y|
1800 BC|Hammurabi|Code sets surgeons' fees and penalties for malpractice|-|Y|
1800 BC|-|Kahun Gynaecological Papyrus|Kahun|N|duplicate:kahun-gynaecological-papyrus
1600 BC|-|Hearst papyrus|-|Y|
1551 BC|-|Ebers Papyrus|-|Y|
1500 BC|-|Saffron used as medicine on Thera|Thera|N|
1500 BC|-|Edwin Smith Papyrus, surgical treatise|-|Y|duplicate:edwin-smith-papyrus
1300 BC|-|Brugsch and London medical papyri|-|N|
1250 BC|Asklepios|Asklepios appears in the medical record|-|Y|
9th century BC|Hesiod|Disease as independent yet divine, Pandora myth|-|Y|
8th century BC|Homer; Polydamna|Healing drugs and battlefield surgery in Homer|Troy|Y|
700 BC|-|Medical schools at Cnidos and Cos|Cnidos; Cos|N|
500 BC|Darius I|Orders restoration of the House of Life (Sais)|-|Y|
500 BC|Bian Que|Physician associated with acupuncture and pulse diagnosis|-|N|
500 BC|Sushruta|Sushruta Samhita|-|N|duplicate:sushruta-samhita
c. 490-430 BC|Empedocles|Theory of four elements|-|Y|
500 BC|-|Pills used for measured doses|-|N|
510-430 BC|Alcmaeon of Croton|Dissection; brain as seat of senses|Croton|Y|
fl. 425 BC|Diogenes of Apollonia|Physician-philosopher, no detail|Apollonia|Y|no-event
c. 484-425 BC|Herodotus|Reports Egyptian doctors specialised|Egypt|Y|
496-405 BC|Sophocles|Surgical problems not to be treated with incantations|-|Y|
420 BC|Hippocrates|Diseases have natural causes; Oath attributed|Cos|N|duplicate:hippocratic-sacred-disease
c. 400-1 BC|-|Huangdi Neijing|-|N|
4th century BC|Praxagoras; Philistion|Praxagoras distinguishes arteries from veins|Locri|Y|
375-295 BC|Diocles of Carystus|Physician, no detail|Carystus|Y|no-event
354 BC|Critobulus of Cos|Removes arrow from Philip II's eye|-|Y|
3rd century BC|Philinus; Herophilos; Erasistratus|Empiricist school; human dissection in Alexandria|Alexandria|N|
280 BC|Herophilus|Nervous system and eye anatomy|-|Y|
270 AD|Huangfu Mi|First textbook devoted to acupuncture|-|N|
250 BC|Erasistratus|Brain: cerebrum and cerebellum distinguished|-|N|
219 AD|Zhang Zhongjing|Shang Han Lun, on cold damage disorders|-|N|
200 BC|Charaka|Charaka Samhita|-|N|
124-44 BC|Asclepiades of Bithynia|Physician, no detail|Bithynia|Y|no-event
116-27 BC|Varro|Proto germ theory (tiny creatures cause disease)|-|Y|
1st century AD|Rufus; Marcellinus; Numisianus|Physicians listed, no detail|Ephesus|Y|no-event
23-79 AD|Pliny the Elder|Natural History|-|N|
c. 25 BC-50 AD|Celsus|Medical encyclopedia (De Medicina)|-|Y|
50-70 AD|Dioscorides|De Materia Medica|-|N|
2nd century AD|Aretaeus of Cappadocia|Physician, no detail|Cappadocia|N|no-event
98-138 AD|Soranus of Ephesus|Physician, no detail|Ephesus|Y|no-event
129-216 AD|Galen|Clinical medicine based on observation|-|Y|
fl. before 210 AD|Fabulla|Medical writer, no detail|-|Y|no-event
d. 260 AD|Gargilius Martialis|Latin handbook on medicines from vegetables and fruit|-|Y|
4th century AD|Magnus of Nisibis|Book on urine|Alexandria|Y|
325-400 AD|Oribasius|70-volume medical encyclopedia|-|Y|
362 AD|Julian|Orders xenones built (proto-hospitals)|-|Y|
369 AD|Basil of Caesarea|Basileias hospital complex|Caesarea, Cappadocia|Y|
375 AD|Ephrem the Syrian|Hospital at Edessa|Edessa|Y|
400 AD|Fabiola|First hospital in Latin Christendom|Rome|Y|
420 AD|Caelius Aurelianus|Latin handbook on acute and chronic diseases|Sicca Veneria|Y|
447 AD|Cassius Felix|Latin medical handbook from Greek sources|Cirta|Y|
480-547 AD|Benedict of Nursia|"Monastic medicine"|-|Y|
484-590 AD|Cassiodorus|Scholar, no medical detail|-|Y|no-event
fl. 511-534 AD|Anthimus|Physician, no detail|-|Y|no-event
500-550 AD|Aetius of Amida|Medical encyclopedia in 16 books|Amida|Y|
536 AD|Sergius of Reshaina|Translates Galen into Syriac|-|Y|
525-605 AD|Alexander of Tralles|Physician, no event|Tralles|Y|no-event
late 6th century AD|Nestorians|Xenodochia/bimaristans that became Islamic hospitals|-|Y|
550-630 AD|Stephanus of Athens|Commentary on Galen's Therapeutics|Athens|Y|
560-636 AD|Isidore of Seville|Named, no event|Seville|N|no-event
c. 620 AD|Aaron of Alexandria|Pandects; first mention of smallpox and measles|Alexandria|Y|
c. 630 AD|Paul of Aegina|Seven-book encyclopedia with surgery|Aegina|Y|
790-869 AD|Leo Itrosophist|Epitome of Medicine|-|N|
c. 800-873 AD|Al-Kindi|De Gradibus, degrees of drug strength|-|N|
820 AD|Benedictines|Hospital at Salerno; School of Salerno|Salerno|Y|
d. 857 AD|Mesue the Elder|Died, no event|-|Y|no-event
c. 830-870 AD|Hunayn ibn Ishaq|Translator; medical tracts|-|Y|
c. 838-870 AD|Ali ibn Sahl Rabban al-Tabari|Arabic encyclopedia of medicine|-|Y|
c. 910 AD|Ishaq ibn Hunayn|Died, no event|-|N|no-event
9th century AD|Yahya ibn Sarafyun|Physician, no event|-|Y|no-event
c. 865-925 AD|Rhazes|Distinguishes smallpox from measles|-|Y|duplicate:al-razi-smallpox-measles
d. 955 AD|Isaac Judaeus|Died, no event|-|Y|no-event
913-982 AD|Shabbethai Donnolo|Hebrew medical writing; alleged Salerno founder|Salerno|Y|
d. 982-994 AD|Ali ibn al-Abbas al-Majusi|Complete Book of the Medical Art|-|Y|
1000 AD|Albucasis|Kitab al-Tasrif, surgical instruments|-|Y|
d. 1075 AD|Ibn Butlan|Tacuinum sanitatis in tables|Baghdad|Y|
1018-1087 AD|Michael Psellos|Books on medicine|-|Y|
c. 1030 AD|Avicenna|Canon of Medicine|-|N|
c. 1071-1078 AD|Simeon Seth|Translates Arabic medicine into Greek|-|Y|
1084 AD|-|First documented English hospital, Canterbury|Canterbury|Y|
d. 1087 AD|Constantine the African|Died, no event|-|Y|no-event
1083-1153 AD|Anna Komnene|Named, no event|-|N|no-event
1095 AD|Antonines|Order founded to treat St Anthony's fire|-|Y|
late 11th-12th century AD|Trotula|Texts on women's medicine|Salerno|Y|
1123 AD|Rahere|St Bartholomew's Hospital founded|London|Y|
1100-1161 AD|Avenzoar|Teacher of Averroes|-|Y|no-event
1170 AD|Roger of Salerno|Chirurgia|Salerno|N|
1126-1198 AD|Averroes|Named, no event|-|Y|no-event
d. c. 1161 AD|Matthaeus Platearius|Died, no event|-|N|no-event
1203 AD|Innocent III|Santo Spirito hospital, Rome|Rome|N|
c. 1210-1277 AD|William of Saliceto|Named, no event|-|N|no-event
1210-1295 AD|Taddeo Alderotti|Scholastic medicine|-|Y|
1240 AD|Bartholomeus Anglicus|Named, no event|-|Y|no-event
1242 AD|Ibn al-Nafis|Pulmonary circulation|-|Y|duplicate:ibn-al-nafis-pulmonary-circulation
c. 1248 AD|Ibn al-Baytar|Botany and pharmacy compendium|-|Y|
1249 AD|Roger Bacon|Convex lenses for long sight|-|N|
1257-1316 AD|Pietro d'Abano|Named, no event|-|Y|no-event
1260 AD|Louis IX|Quinze-Vingts, Paris|Paris|Y|
c. 1260-1320 AD|Henri de Mondeville|Named, no event|-|N|no-event
1284 AD|-|Mansuri hospital, Cairo|Cairo|Y|duplicate:mansuri-bimaristan
c. 1275-1328 AD|John Zacharias Actuarius|Last great Byzantine medical compendium|-|Y|
1275-1326 AD|Mondino de Luzzi|Systematic human dissection resumed|Bologna|Y|
1288 AD|-|Santa Maria Nuova hospital, Florence|Florence|Y|
1300 AD|-|Concave lenses for myopia|Italy|Y|
1310 AD|Pietro d'Abano|Conciliator|-|Y|
d. 1348 AD|Gentile da Foligno|Died, no event|-|Y|no-event
1292-1350 AD|Ibn Qayyim al-Jawziyya|Named, no event|-|Y|no-event
1306-1390 AD|John of Arderne|Named, no event|-|Y|no-event
d. 1368 AD|Guy de Chauliac|Died, no event|-|Y|no-event
fl. 1460 AD|Heinrich von Pfolspeundt|Active, no event|-|Y|no-event
1443-1502 AD|Antonio Benivieni|Pathological anatomy|Florence|Y|
1493-1541 AD|Paracelsus|Medicine and surgery|-|Y|no-event
early 16th century AD|Paracelsus; Fabricius; Stromayr|Chemicals in medicine|-|Y|
1500-1561 AD|Pierre Franco|Surgeon, no event|-|Y|no-event
1510-1590 AD|Ambroise Paré and others|Treatment of gunshot wounds|Paris|Y|
1518 AD|College of Physicians|Royal charter, London|London|Y|
1510-1590 AD|Ambroise Paré|Gunshot wounds (repeat entry)|-|Y|duplicate:wp-repeat-pare
1540-1604 AD|William Clowes|Surgical chest for military surgeons|-|Y|
1543 AD|Vesalius|De Fabrica|-|Y|duplicate:vesalius-fabrica
1546 AD|Fracastoro|Contagion by seed-like entities|-|N|
1550-1612 AD|Peter Lowe|Named, no event|-|Y|no-event
1553 AD|Michael Servetus|Pulmonary circulation described|-|N|
1556 AD|Amato Lusitano|Venous valves in the azygos vein|-|N|
1559 AD|Realdo Colombo|Pulmonary circulation in detail|-|N|
1563 AD|Garcia de Orta|Colóquios: treatise on Indian diseases and drugs|Goa|N|
1570-1643 AD|John Woodall|The Surgions Mate; lemon juice against scurvy|-|Y|
1590 AD|-|Compound microscope invented|-|N|
1596 AD|Li Shizhen|Compendium of Materia Medica|-|N|
1603 AD|Girolamo Fabrici|Valves in leg veins|Padua|N|
1621-1676 AD|Richard Wiseman|Surgeon, no event|-|Y|no-event
1628 AD|William Harvey|Circulation of the blood|-|N|
1665 AD|Robert Hooke|Micrographia; names cells|-|N|
1683-1758 AD|Lorenz Heister|No event|-|Y|no-event
1688-1752 AD|William Cheselden|No event|-|Y|no-event
1701 AD|Giacomo Pylarini|Early smallpox inoculation in Europe|-|N|
1714-1789 AD|Percivall Pott|No event|-|Y|no-event
1720 AD|Lady Mary Wortley Montagu|No event described|-|N|no-event
1728-1793 AD|John Hunter|No event|-|Y|no-event
1736 AD|Claudius Amyand|First successful appendectomy|London|N|
1744-1795 AD|Pierre-Joseph Desault|First surgical periodical|Paris|Y|
1747 AD|James Lind|Citrus prevents scurvy|-|N|duplicate:lind-scurvy-trial
1749-1806 AD|Benjamin Bell|Surgery textbook|-|Y|
1752-1832 AD|Antonio Scarpa|No event|-|Y|no-event
1763-1820 AD|John Bell|No event|-|Y|no-event
1766-1842 AD|Dominique Jean Larrey|Surgeon to Napoleon|-|Y|
1768-1843 AD|Astley Cooper|Lectures and writing on surgery|-|Y|
1774-1842 AD|Charles Bell|No event|-|Y|no-event
1774 AD|Joseph Priestley|Discovers oxygen, nitrous oxide, ammonia|-|N|
1777-1835 AD|Guillaume Dupuytren|Head surgeon at a Paris hospital|Paris|Y|
1785 AD|William Withering|Foxglove (digitalis) for dropsy|-|N|
1790 AD|Samuel Hahnemann|Homeopathy|-|N|
1796 AD|Edward Jenner|Smallpox vaccination|-|N|duplicate:jenner-cowpox-vaccination
1799 AD|Humphry Davy|Anaesthetic properties of nitrous oxide|-|N|
1800 AD|Humphry Davy|Announces nitrous oxide's anaesthetic properties|-|N|duplicate:wp-repeat-davy
1803-1841 AD|Friedrich Sertürner|Isolates morphine|-|N|
1813-1883 AD|J. Marion Sims|Vesicovaginal fistula surgery|-|Y|
1816 AD|René Laennec|Stethoscope|-|N|duplicate:laennec-stethoscope
1827-1912 AD|Joseph Lister|Antiseptic surgery|-|Y|duplicate:lister-antisepsis
1818 AD|James Blundell|Human-to-human blood transfusion|-|N|
1842 AD|Crawford Long|Ether in surgery|-|N|duplicate:ether-anaesthesia
1845 AD|John Hughes Bennett|Leukaemia described|-|N|
1846 AD|-|Surgery under general anaesthesia|-|N|duplicate:ether-anaesthesia
1847 AD|Ignaz Semmelweis|Prevention of puerperal fever|-|N|duplicate:semmelweis-handwashing
1849 AD|Elizabeth Blackwell|First woman MD in the United States|Geneva, New York|N|
1850 AD|Female Medical College of Pennsylvania|First medical college for women|Philadelphia|Y|
1858 AD|Rudolf Virchow|Cellular pathology|Berlin|N|
1861 AD|Louis Pasteur|Germ theory|-|N|
1861 AD|Herman Snellen|Snellen eye chart|Utrecht|N|
1867 AD|Joseph Lister|Antiseptic principle published|-|N|duplicate:lister-antisepsis
1870 AD|Pasteur; Koch|Germ theory established|-|N|duplicate:wp-merge-germ-theory
1878 AD|Ellis Reynolds Shipp|Graduates and practises in Utah|Utah|N|
1879 AD|-|First cholera vaccine|-|N|
1881 AD|Louis Pasteur|Anthrax vaccine|-|N|
1882 AD|Louis Pasteur|Rabies vaccine|-|N|
1887 AD|Willem Einthoven|Electrocardiography|-|Y|
1890 AD|Emil von Behring|Antitoxins; diphtheria and tetanus|-|N|duplicate:serum-therapy
1895 AD|Wilhelm Röntgen|X-rays|-|N|duplicate:rontgen-x-rays
1901 AD|Karl Landsteiner|Blood groups|Vienna|N|
1901 AD|Alois Alzheimer|First case of Alzheimer's disease|Frankfurt|N|
1906 AD|Frederick Hopkins|Accessory food factors (vitamins)|Cambridge|N|
1907 AD|Paul Ehrlich|Chemotherapy for sleeping sickness|-|N|
1907 AD|Henry Plummer|Unit patient record|Mayo Clinic|N|
1908 AD|Victor Horsley; Robert Clarke|Stereotactic method|London|N|
1909 AD|Richard Richter|Intrauterine device described|-|Y|
1910 AD|Hans Christian Jacobaeus|Laparoscopy in humans|Stockholm|N|
1917 AD|Julius Wagner-Jauregg|Malaria therapy for general paresis|Vienna|N|
1921 AD|Edward Mellanby|Vitamin D deficiency causes rickets|-|N|
1921 AD|Banting; Best|Insulin|Toronto|N|duplicate:insulin-toronto
1921 AD|Fidel Pagés|Epidural anaesthesia|Madrid|N|
1923 AD|-|First diphtheria vaccine|-|N|
1924 AD|Hans Berger|Human EEG|Jena|Y|
1926 AD|-|First pertussis vaccine|-|N|
1927 AD|-|First tuberculosis vaccine (BCG)|-|N|
1927 AD|-|First tetanus vaccine|-|N|
1930 AD|-|Gender-affirming surgery, Lili Elbe|Dresden|N|
1932 AD|Gerhard Domagk|Sulfonamide (Prontosil)|-|N|
1933 AD|Manfred Sakel|Insulin shock therapy|Vienna|N|
1935 AD|Ladislas Meduna|Metrazol convulsive therapy|Budapest|N|
1935 AD|-|First yellow fever vaccine|-|N|
1936 AD|Egas Moniz|Prefrontal leucotomy|Lisbon|N|
1936 AD|Enrique Finochietto|Self-retaining thoracic retractor|Buenos Aires|N|
1938 AD|Cerletti; Bini|Electroconvulsive therapy|Rome|N|
1938 AD|Florey; Chain|Penicillin development|Oxford|N|duplicate:penicillin
1943 AD|Willem Kolff|Dialysis machine|Kampen|N|
1944 AD|David S. Sheridan|Disposable catheter|-|N|
1946 AD|Gilman; Goodman|Chemotherapy (nitrogen mustard)|New Haven|N|
1947 AD|Claude Beck|Defibrillation of the human heart|Cleveland|N|
1948 AD|Axelrod; Brodie|Acetaminophen (paracetamol) as active metabolite|-|N|
1948 AD|World Health Organization|WHO founded|Geneva|N|
1949 AD|Harold Ridley|Intraocular lens implant|London|N|
1949 AD|John Emerson|Mechanical ventilation assistor|-|N|
1952 AD|Jonas Salk|Polio vaccine|Pittsburgh|N|duplicate:polio-vaccine-trials
1952 AD|Briggs; King|Nuclear transfer cloning (frogs)|Philadelphia|N|
1953 AD|-|Live birth from frozen sperm|-|N|
1953 AD|John Gibbon|Heart-lung machine used in surgery|Philadelphia|N|
1953 AD|Inge Edler|Echocardiography|Lund|N|
1954 AD|Joseph Murray|Kidney transplant between identical twins|Boston|N|
1954 AD|Tage Malmström|Vacuum extractor (ventouse)|Gothenburg|N|
1955 AD|Lloyd Conover|Tetracycline|-|N|
1956 AD|3M|Metered-dose inhaler|-|N|
1957 AD|William Grey Walter|Toposcope (EEG topography)|Bristol|N|
1958 AD|Rune Elmqvist|Implanted pacemaker|Stockholm|N|
1959 AD|Min Chueh Chang|In vitro fertilisation (rabbits)|Shrewsbury, Massachusetts|N|
1960 AD|-|Cardiopulmonary resuscitation|-|N|
1960 AD|-|Combined oral contraceptive approved by FDA|USA|Y|
1962 AD|John Charnley|Hip replacement|Wrightington|N|
1962 AD|James Black|Beta blocker|-|N|
1962 AD|Albert Sabin|Oral polio vaccine|-|N|duplicate:polio-vaccine-trials
1963 AD|Paul Winchell|Artificial heart (patent)|-|N|
1963 AD|Thomas Starzl|Liver transplant|Denver|N|
1963 AD|James Hardy|Lung transplant|Jackson, Mississippi|N|
1963 AD|Leo Sternbach|Diazepam|-|N|
1964 AD|-|First measles vaccine|-|N|
1965 AD|Frank Pantridge|Portable defibrillator|Belfast|N|
1965 AD|-|First commercial ultrasound|-|N|
1966 AD|C. Walton Lillehei; Richard Lillehei; William Kelly|Pancreas transplant|Minneapolis|N|
1966 AD|Meyer; Parkman|Rubella vaccine|-|Y|
1967 AD|-|First mumps vaccine|-|N|
1967 AD|René Favaloro|Coronary bypass surgery|Cleveland|N|
1967 AD|Christiaan Barnard|Heart transplant|Cape Town|N|duplicate:first-heart-transplant
1968 AD|Samuel Alderson|Powered prosthesis|-|N|
1968 AD|Alejandro Zaffaroni|Controlled drug delivery|-|N|
1969 AD|Thomas Fogarty|Balloon catheter|-|N|
1969 AD|William House|Cochlear implant|Los Angeles|N|
1970 AD|-|Cyclosporine as immunosuppressant|-|N|
1971 AD|Maurice Hilleman|MMR vaccine|-|N|
1971 AD|Ananda Chakrabarty|Genetically modified organism (patent)|-|N|
1971 AD|Raymond Damadian|MRI|-|N|
1971 AD|Godfrey Hounsfield|CT scanning|London|N|duplicate:ct-scanning
1971 AD|Alejandro Zaffaroni|Transdermal patch|-|N|
1971 AD|Godfrey Hounsfield|Commercial CT scanner|-|N|duplicate:ct-scanning
1972 AD|Dean Kamen|Insulin pump|-|N|
1973 AD|Mani Lal Bhaumik|Laser eye surgery|-|N|
1974 AD|Giorgio Fischer|Liposuction|-|N|
1976 AD|-|Commercial PET scanner|-|N|
1978 AD|-|First IVF birth|Oldham|N|duplicate:ivf-1978
1978 AD|-|Last fatal smallpox case (Birmingham)|Birmingham|Y|
1979 AD|Hitchings; Elion|Antiviral drugs (aciclovir)|-|N|
1980 AD|WHO|Smallpox declared eradicated|Geneva|N|duplicate:smallpox-eradication
1980 AD|Raymond Damadian|Commercial MRI scanner|-|N|
1980 AD|Dornier|Lithotripter|-|N|
1980 AD|Baruch Blumberg|Hepatitis B vaccine|-|N|
1980 AD|Sidney Pestka|Cloning of interferons|-|N|
1981 AD|Burke; Yannas|Artificial skin|Boston|N|
1981 AD|Bruce Reitz|Heart-lung transplant|Stanford|N|
1982 AD|Eli Lilly|Human insulin (recombinant)|-|N|
1982 AD|Willem Kolff; William DeVries|Permanent artificial heart|Salt Lake City|Y|
1985 AD|Leroy Hood; Lloyd Smith|Automated DNA sequencer|Pasadena|N|
1985 AD|Kary Mullis|Polymerase chain reaction|-|N|
1985 AD|Yik San Kwoh|Robot-assisted surgery|Long Beach|N|
1985 AD|Alec Jeffreys|DNA fingerprinting|Leicester|N|
1985 AD|Tarun Mullick|Capsule endoscopy|-|N|
1986 AD|Eli Lilly|Fluoxetine|-|N|
1987 AD|Merck|Statins available (lovastatin)|-|N|
1987 AD|Vacanti; Langer|Tissue engineering|Boston|N|
1988 AD|Julio Palmaz|Intravascular stent|-|N|
1988 AD|Patricia Bath|Laserphaco cataract surgery|-|N|
1989 AD|Alan Handyside|Pre-implantation genetic diagnosis|London|N|
1989 AD|Stephen Fodor|DNA microarray|-|N|
1990 AD|Igor Gamow|Gamow bag|-|N|
1992 AD|Pedro and Josep Brugada|Brugada syndrome described|-|N|
1992 AD|-|Hepatitis A vaccine|-|Y|
1992 AD|SRI International|Electroactive polymers (artificial muscle)|-|N|
1992 AD|André Van Steirteghem; Gianpiero Palermo|ICSI|Brussels|N|
1995 AD|B. G. Matapurkar|Adult stem cells for tissue regeneration (patent)|-|N|
1996 AD|-|Dolly the sheep cloned|Roslin|N|
1998 AD|James Thomson|Human embryonic stem cells|Madison|N|
1999 AD|Kojima; Kangawa|Ghrelin identified|-|Y|
2000 AD|-|Human Genome Project draft|-|N|
2001 AD|Jacques Marescaux|Transatlantic telesurgery|New York; Strasbourg|N|
2003 AD|Carlo Urbani|Alerts WHO to SARS|Hanoi|N|
2005 AD|Jean-Michel Dubernard; Bernard Devauchelle|Partial face transplant|Amiens|N|
2006 AD|-|First HPV vaccine|-|N|
2006 AD|-|Second rotavirus vaccine|-|N|
2007 AD|-|Argus II retinal prosthesis|-|N|
2008 AD|Laurent Lantieri|Full face transplant|Paris|N|
2011 AD|-|Uterus transplant from deceased donor|Turkey|N|
2013 AD|-|Kidney grown in vitro|USA|N|
2013 AD|-|Liver bud grown from stem cells|Japan|N|
2014 AD|-|3D-printed skull implant|-|N|
2014 AD|Sonendo|GentleWave root canal system|Laguna Hills|N|
2016 AD|-|Artificial pancreas (hybrid closed loop) approved|-|N|
2019 AD|-|3D-printed heart from patient cells|Tel Aviv|N|
2020 AD|-|First COVID-19 vaccine|-|N|duplicate:mrna-vaccines
2022 AD|-|Complete human genome sequence|-|N|
"""
rows = []
for i, line in enumerate([l for l in RAW.strip().split('\n') if l.strip()], 1):
    p = line.split('|')
    date, who, claim, place, cited = p[:5]
    st = p[5] if len(p) > 5 else ''
    status, atlas = 'pending', None
    if st.startswith('duplicate:'):
        status, atlas = 'duplicate', st.split(':', 1)[1]
    elif st == 'no-event':
        status = 'no-event'
    rows.append({'wid': f'w{i:03d}', 'wpDate': date.strip(), 'who': who.strip(), 'claim': claim.strip(),
                 'place': place.strip(), 'wpCited': cited.strip() == 'Y', 'status': status,
                 'atlasId': atlas, 'note': ''})
for r in rows:
    if r['atlasId'] and r['atlasId'].startswith('wp-'):
        r['note'] = {'wp-repeat-pare': 'Repeats the Paré entry above.', 'wp-repeat-davy': 'Same event as the 1799 Davy entry.',
                     'wp-merge-germ-theory': 'Handled together with the 1861 Pasteur germ-theory entry.'}[r['atlasId']]
        r['atlasId'] = None
json.dump({'source': 'https://en.wikipedia.org/wiki/Timeline_of_medicine_and_medical_technology',
           'read': '2026-11-19', 'entries': rows}, open('research/wikipedia-queue.json', 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print(len(rows), Counter(r['status'] for r in rows))
