import * as express from 'express'
import ERROR_CODES from '../../common/error_codes'
import Database from '../database'

function open(app: express.Express) {
  app.post('/search_user', async (req, res) => {
    //username
    try {
      if (typeof req.body.username !== 'string')
        return res.json({ error: ERROR_CODES.INCORRECT_DATA_SENT })

      let db_res = await Database.searchAccount(req.body.username)
      if (db_res.error !== ERROR_CODES.SUCCESS || !db_res.accounts)
        return res.json({ error: db_res.error })
      return res.json({ error: ERROR_CODES.SUCCESS, accounts: db_res.accounts })
    } catch (e) {
      console.error(e)
      return res.json({ error: ERROR_CODES.UNKNOWN })
    }
  })

  app.post('/search_game', async (req, res) => {
    //name
    try {
      if (typeof req.body.name !== 'string')
        return res.json({ error: ERROR_CODES.INCORRECT_DATA_SENT })

      let db_res = await Database.searchGame(req.body.name)
      if (db_res.error !== ERROR_CODES.SUCCESS || !db_res.games)
        return res.json({ error: db_res.error })
      return res.json({ error: ERROR_CODES.SUCCESS, games: db_res.games })
    } catch (e) {
      console.error(e)
      return res.json({ error: ERROR_CODES.UNKNOWN })
    }
  })
}

export default { open }
