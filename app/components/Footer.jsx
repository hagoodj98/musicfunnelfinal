import Logo from '../../public/logo.svg';
import Image from 'next/image';

const Footer = () => {
  return (
    <div className='tw-flex tw-bg-lighterblue'>
        <div className='tw-w-56'>
            <Image src={Logo} alt='My personal logo'/>
        </div>
        <div>
            <p className='tw-text-2xl tw-text-white'>Privacy | Terms and Conditions</p>
            <p className='tw-text-white'>Copyright&copy; . Al Rights Reversed</p>
            <p className='tw-text-white'>For Questions or Support, Please Email me at west00brook@gmail.com</p>
        </div>
     
    </div>
  )
}

export default Footer;
