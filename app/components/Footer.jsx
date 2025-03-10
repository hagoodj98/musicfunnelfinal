import Logo from '../../public/logo.svg';
import Image from 'next/image';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TwitterIcon from '@mui/icons-material/Twitter';
import Button from '@mui/material/Button';
import Link from 'next/link';


const Footer = () => {


  const date = new Date();
  const year = date.getFullYear();
  
  return (
    <div className='  tw-bg-lighterblue'>
      <div className=' container lg:tw-flex tw-py-5 lg:tw-justify-between'>
        <div className='lg:tw-w-1/3'>
          <Link className='tw-no-underline tw-text-xl tw-text-white hover:tw-text-yellow' href='/' >@JH Studios</Link>
          <p className='tw-text-white'> Copyright &copy; {year}. All Rights Reversed</p>
        </div>
        <div className='lg:tw-w-1/3 tw-flex tw-flex-col'>
        <p className='tw-text-white'><Link className='tw-no-underline tw-text-white hover:tw-text-yellow' href="/privacy-policy" >Privacy Policy</Link>  |  <Link className='tw-no-underline  tw-text-white hover:tw-text-yellow' href="/terms-and-conditions">Terms Of Use</Link></p>
        <div className=' tw-text-white tw-w-1/2 tw-flex tw-justify-around tw-my-3'>
          <FacebookIcon className='hover:tw-text-yellow' fontSize='large' />
          <InstagramIcon className='hover:tw-text-yellow' fontSize='large' />
          <TwitterIcon className='hover:tw-text-yellow'  fontSize='large' />
        </div>
        <p className='tw-text-white'>For Questions or Support, email at jaiquezmanage98@gmail.com</p>
      </div>
      </div>
    </div>
  )
}

export default Footer;
