import Logo from '../../public/logo.svg';
import Image from 'next/image';

import Button from '@mui/material/Button';
import Link from 'next/link';
import Privacy from './PrivacyOffCanvas';
import Terms from './TermsOffCanvas';
import SocialMediaButtonGroup from './SocialMediaGroupButton'

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
          <div className='tw-flex tw-text-white'>
            <Privacy name= 'Privacy Policy' placement='start'/> |
            <Terms name= 'Terms of Use' placement='start' />
          </div>
        <div >
          <SocialMediaButtonGroup />
        </div>
        <p className='tw-text-white'>For Questions or Support, email at jaiquezmanage98@gmail.com</p>
      </div>
      </div>
    </div>
  )
}

export default Footer;
