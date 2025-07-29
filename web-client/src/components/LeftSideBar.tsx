import React from 'react'
import newsService from '../services/NewsService'
import authService from '../services/AuthService'

type Props = {}

const leftSideBar = (props: Props) => {
  const getUserCategories = () => {
    const isAuthenticated = authService.isAuthenticated();
    if (isAuthenticated) {
      const userId = authService.getUserId();
      if (userId) {
        newsService.getCategories()
      }
    }
  }
  
  return (
    <div>

    </div>
  )
}

export default leftSideBar