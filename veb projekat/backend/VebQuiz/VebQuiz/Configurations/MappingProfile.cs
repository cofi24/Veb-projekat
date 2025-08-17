using AutoMapper;
using VebQuiz.DTO;
using VebQuiz.Model;

namespace VebQuiz.Configurations
{
    public class MappingProfile:Profile
    {
        public MappingProfile() 
        {

            CreateMap<RegisterDTO, User>()
               .ForMember(dest => dest.PasswordHash, opt => opt.Ignore()) 
               .ForMember(dest => dest.ProfilePictureData, opt => opt.Ignore())
               .ForMember(dest => dest.ProfilePictureContentType, opt => opt.Ignore())
               .ForMember(dest => dest.ProfilePictureSize, opt => opt.Ignore());

        }
    }
}
