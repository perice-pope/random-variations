const _ = require('lodash')
const tonal = require('tonal')

const getRawData = () => `
one up	1			
one down	-1			
two up	2	1		
two down	-2	-1		
one up, one down	1	-1		
one down, one up	-1	1		
three up	3	2	1	
three down	-3	-2	-1	
two up, one down	2	1	-1	
two down, one up	-2	-1	1	
one up, two down	1	-2	-1	
one down, two up	-1	2	1	
four up	4	3	2	1
four down	-4	-3	-2	-1
three up, one down	3	2	1	-1
three down, one up	-3	-2	-1	1
two up, two down	2	1	-2	-1
two down, two up	-2	-1	2	1
one up, three down	1	-3	-2	-1
one down, three up	-1	3	2	1
`

const td = require('tonal-distance')

const getData = () => {
  const raw = getRawData()
  return raw
    .split('\n')
    .map(row => {
      let [type, ...semitones] = row.split('\t').map(s => s.trim())
      if (!type || !semitones) {
        return null
      }
      semitones = semitones.filter(x => x != '')
      return {
        type,
        title: _.capitalize(type),
        semitones: semitones.map(s => parseInt(s, 10)),
      }
    })
    .filter(x => x)
}

const data = getData()
console.log(JSON.stringify(data, null, 2))
