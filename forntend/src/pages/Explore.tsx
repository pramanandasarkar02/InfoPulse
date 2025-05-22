import React from 'react'
import sampleNews from '../assets/news.json'
type Props = {}

const Explore = (props: Props) => {
  const news = sampleNews
  
  return (
    <>
    {news.map((item: any) => (
      <div key={item.id}>
        <a onClick={() => window.open(item.url)}><h2>{item.title}</h2></a>
        <p>{item.description}</p>
      </div>
    ))}
    </>
  )
}

export default Explore