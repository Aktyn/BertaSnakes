import { ObjectId } from 'mongodb'
import { AccountSchema, COLLECTIONS, getCollection } from '..'
import ERROR_CODES from '../../../common/error_codes'
import { CoinPackSchema } from '../../../common/config'

const DAY_MS = 1000 * 60 * 60 * 24
const PROJECT_DATE = {
  /*$reduce: {
		input: {
			$map: {
				input: {
					$objectToArray: '$_id'
				},
				as: 'value',
				in: {
					$substr: ['$$value.v', 0, 4]
				}
			}
		},
		initialValue: '',
		in: {
			$concat: [
				'$$value',
				{
					$cond: [
						{
							$eq: ['$$value', '']
						},
						'',
						'-'
					]
				},
				'$$this'
			]
		}
	}*/
  $map: {
    input: {
      $objectToArray: '$_id',
    },
    as: 'value',
    in: '$$value.v',
  },
}

function dateCompare(
  dt1: [number, number, number],
  dt2: [number, number, number],
) {
  return dt1[0] === dt2[0] && dt1[1] === dt2[1] && dt1[2] === dt2[2]
}

function dateToValue(date: [number, number, number]) {
  //[year, month, day]
  return date[2] + date[1] * 100 + date[0] * 10000
}

function dateSort(
  a: { date: [number, number, number] },
  b: { date: [number, number, number] },
) {
  let value_a = dateToValue(a.date) //eg.: [ 2019, 7, 14 ] =>
  let value_b = dateToValue(b.date) //=> 2019*10000 + 7*100 + 14 = 20190714
  return value_a - value_b
}

function getDateRangeValues(from: number, to: number) {
  let from_dt = new Date(from)
  let to_dt = new Date(to)
  return {
    min: dateToValue([
      from_dt.getFullYear(),
      from_dt.getMonth() + 1,
      from_dt.getDate(),
    ]),
    max: dateToValue([
      to_dt.getFullYear(),
      to_dt.getMonth() + 1,
      to_dt.getDate(),
    ]),
  }
}

function statsMatchConditions(from: number, to: number, account_hex?: string) {
  let cond: any = {
    $and: [
      {
        _id: {
          $gt: ObjectId.createFromTime((from / 1000) | 0),
          //ObjectId.createFromHexString(Math.floor(from / 1000).toString(16) + "0000000000000000")
        },
      },
      {
        _id: {
          $lt: ObjectId.createFromTime((to / 1000) | 0),
          //ObjectId.createFromHexString(Math.floor(to / 1000).toString(16) + "0000000000000000")
        },
      },
    ],
  }

  if (account_hex) cond.account_id = ObjectId.createFromHexString(account_hex)

  return cond
}

async function registerUserAgent(agent: string) {
  try {
    let existing = await getCollection(COLLECTIONS.user_agents).findOne({
      agent: agent,
    })
    if (existing) return existing._id as ObjectId

    let insert_res = await getCollection(COLLECTIONS.user_agents).insertOne({
      agent: agent,
    })

    if (insert_res.result.ok) return insert_res.insertedId

    return null
  } catch (e) {
    console.error(e)
    return null
  }
}

export default {
  async registerVisit(
    account: AccountSchema | null,
    user_agent: string,
    ip: string,
  ) {
    try {
      let agent_id = await registerUserAgent(user_agent)

      await getCollection(COLLECTIONS.visits).insertOne({
        account_id: account ? ObjectId.createFromHexString(account.id) : null,
        user_agent_id: agent_id,
        ip: ip,
      })
    } catch (e) {
      console.error(e)
    }
  },

  async getUserVisitStatistics(
    from: number,
    to: number,
    account_hex_id: string,
  ) {
    //timestamps range
    interface VisitsResponseItem {
      count: number
      date: [number, number, number]
    }

    try {
      let visits: VisitsResponseItem[] = await getCollection(COLLECTIONS.visits)
        .aggregate([
          {
            $match: statsMatchConditions(from, to, account_hex_id),
          },
          {
            $group: {
              _id: {
                year: { $year: '$_id' },
                month: { $month: '$_id' },
                day: { $dayOfMonth: '$_id' },
              },
              count: { $sum: 1 },
            },
          },
          {
            $limit: 365,
          },
          {
            $project: {
              _id: 0,
              count: 1,
              date: PROJECT_DATE,
            },
          },
        ])
        .toArray()

      const range = getDateRangeValues(from, to)
      visits = visits.sort(dateSort).filter((v) => {
        let date_value = dateToValue(v.date)
        return date_value >= range.min && date_value <= range.max
      })

      //TODO: move gaps filling algorithm to client-side
      for (let ts = from, i = 0; ts < to; ts += DAY_MS, i++) {
        //fill gaps in database response
        let dt = new Date(ts)
        let date_arr: [number, number, number] = [
          dt.getFullYear(),
          dt.getMonth() + 1,
          dt.getDate(),
        ]
        if (!visits[i] || !dateCompare(visits[i].date, date_arr))
          visits.splice(i, 0, { count: 0, date: date_arr })
      }

      //console.log(visits);

      return { error: ERROR_CODES.SUCCESS, data: visits }
    } catch (e) {
      console.error(e)
      return { error: ERROR_CODES.DATABASE_ERROR }
    }
  },

  async getVisitsStatistics(from: number, to: number) {
    //timestamps range
    interface VisitsResponseItem {
      total_visits: number
      unique_visits: number
      date: [number, number, number]
    }

    try {
      let visits: VisitsResponseItem[] = await getCollection(COLLECTIONS.visits)
        .aggregate([
          {
            $match: statsMatchConditions(from, to),
          },
          {
            $group: {
              _id: {
                year: { $year: '$_id' },
                month: { $month: '$_id' },
                day: { $dayOfMonth: '$_id' },
                ip: '$ip',
              },
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: {
                year: '$_id.year',
                month: '$_id.month',
                day: '$_id.day',
              },
              total_visits: { $sum: '$count' },
              unique_visits: { $sum: 1 },
            },
          },
          {
            $limit: 365,
          },
          {
            $project: {
              _id: 0,
              total_visits: 1,
              unique_visits: 1,
              date: PROJECT_DATE,
            },
          },
        ])
        .toArray()

      const range = getDateRangeValues(from, to)
      visits = visits.sort(dateSort).filter((v) => {
        let date_value = dateToValue(v.date)
        return date_value >= range.min && date_value <= range.max
      })

      for (let ts = from, i = 0; ts < to; ts += DAY_MS, i++) {
        //fill gaps in database response
        let dt = new Date(ts)
        let date_arr: [number, number, number] = [
          dt.getFullYear(),
          dt.getMonth() + 1,
          dt.getDate(),
        ]
        if (!visits[i] || !dateCompare(visits[i].date, date_arr))
          visits.splice(i, 0, {
            total_visits: 0,
            unique_visits: 0,
            date: date_arr,
          })
      }

      //console.log(visits);

      return { error: ERROR_CODES.SUCCESS, data: visits }
    } catch (e) {
      console.error(e)
      return { error: ERROR_CODES.DATABASE_ERROR }
    }
  },

  async registerPayment(
    account_hex_id: string,
    pack: CoinPackSchema,
    currency: string,
    user_agent: string,
    ip: string,
  ) {
    try {
      let agent_id = await registerUserAgent(user_agent)

      await getCollection(COLLECTIONS.payments).insertOne({
        account_id: ObjectId.createFromHexString(account_hex_id),
        user_agent_id: agent_id,
        ip: ip,
        currency: currency,
        coins: pack.coins,
        price: pack.price,
      })
    } catch (e) {
      console.error(e)
    }
  },

  async getPaymentsStatistics(from: number, to: number) {
    //timestamps range
    interface PaymentsResponseItem {
      count: number
      date: [number, number, number]
    }

    try {
      let payments: PaymentsResponseItem[] = await getCollection(
        COLLECTIONS.payments,
      )
        .aggregate([
          {
            $match: statsMatchConditions(from, to),
          },
          {
            $group: {
              _id: {
                year: { $year: '$_id' },
                month: { $month: '$_id' },
                day: { $dayOfMonth: '$_id' },
              },
              count: { $sum: 1 },
            },
          },
          {
            $limit: 365,
          },
          {
            $project: {
              _id: 0,
              count: 1,
              date: PROJECT_DATE,
            },
          },
        ])
        .toArray()

      const range = getDateRangeValues(from, to)
      payments = payments.sort(dateSort).filter((v) => {
        let date_value = dateToValue(v.date)
        return date_value >= range.min && date_value <= range.max
      })

      // noinspection DuplicatedCode
      for (let ts = from, i = 0; ts < to; ts += DAY_MS, i++) {
        //fill gaps in database response
        let dt = new Date(ts)
        let date_arr: [number, number, number] = [
          dt.getFullYear(),
          dt.getMonth() + 1,
          dt.getDate(),
        ]
        if (!payments[i] || !dateCompare(payments[i].date, date_arr))
          payments.splice(i, 0, { count: 0, date: date_arr })
      }

      //console.log(visits);

      return { error: ERROR_CODES.SUCCESS, data: payments }
    } catch (e) {
      console.error(e)
      return { error: ERROR_CODES.DATABASE_ERROR }
    }
  },
}
