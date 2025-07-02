import Image from "next/image"

export default function LogoHeader({ withName = true }: { withName?: boolean }) {
  return (
    <header className="flex shrink-0 items-center gap-2 px-4 h-fit">
      <div className="flex items-center gap-2">
        <Image src={"/logo-only.svg"} alt="N.A.M.E" height={50} width={50} />
        {withName && (
          <h1 className="text-xl font-semibold text-black dark:text-white">N.A.M.E</h1>
        )}
      </div>
    </header>
  )
}